import {RefreshingAuthProvider} from '@twurple/auth';
import {NodeCG, Replicant} from '../../../../types/server';
import {getTwitchAuthRouter} from "./router/twitch-auth";
import {
	PubSubEventMessage,
	TwitchChatClientListeners,
	TwitchClip,
	TwitchCredentials,
	TwitchEvent,
	TwitchPubSubListeners
} from "./types";
import {ApiClient} from "@twurple/api";
import {SingleUserPubSubClient} from '@twurple/pubsub';
import {ChatClient} from '@twurple/chat';
import {ParsedMessagePart} from '@twurple/common';
import {TwitchPrivateMessage} from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import {rawDataSymbol} from '@twurple/common';

interface ChatMessageData {
	username: string,
	messageTime: string,
	messageId: string,
	parsedMessage: [ParsedMessagePart],
}

function Bundle(nodecg: NodeCG) {
	const twitchCredentials: Replicant<TwitchCredentials> = nodecg.Replicant('twitchCredentials', {
		defaultValue: {
			clientId: '',
			clientSecret: '',
			accessToken: undefined,
			refreshToken: undefined,
			expiresIn: 0,
			obtainmentTimestamp: 0,
			connectedAs: undefined,
			isConnected: false,
		}
	});
	const twitchEvents: Replicant<TwitchEvent[]> = nodecg.Replicant('twitchEvents', {defaultValue: []});
	const twitchClips: Replicant<TwitchClip[]> = nodecg.Replicant('twitchClips', {defaultValue: []});
	const twitchChat: Replicant<ChatMessageData[]> = nodecg.Replicant('twitchChat', {defaultValue: []});
	nodecg.Replicant<{ [id: string]: TwitchClip }>('twitchSelectedClips', {defaultValue: {}});

	let twitchClient: ApiClient;
	let twitchPubSubClient;
	let twitchChatClient;
	let twitchPubSubListeners: TwitchPubSubListeners = {};
	let twitchChatClientListeners: TwitchChatClientListeners = {};

	const addTwitchPubSubEvent = (messageName: string) => (data: PubSubEventMessage) => {
		nodecg.log.info(`Received message ${messageName}`);
		nodecg.log.info(`Raw Data: ${JSON.stringify(data[rawDataSymbol].data, null, 4)}`);
		twitchEvents.value.unshift({type: 'PubSub', messageName, data: data[rawDataSymbol].data});
		nodecg.sendMessage(messageName, data[rawDataSymbol].data);
	};
	const clearTwitchEvents = () => {
		twitchEvents.value = []
	};
	const updateTwitchClips = () => {
		if (!twitchCredentials.value.connectedAs)
			return;

		twitchClient.clips.getClipsForBroadcasterPaginated(twitchCredentials.value.connectedAs).getAll().then(clips => {
			twitchClips.value = clips.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime()).map(clip => {
				const {id, creatorDisplayName, title, creationDate} = clip;
				const thumbnailUrl = clip.thumbnailUrl.replace("-preview-480x272.jpg", ".mp4");
				// nodecg.log.info('Clips: ' + thumbnailUrl);
				return {
					id,
					url: thumbnailUrl,
					creator_name: creatorDisplayName,
					title,
					created_at: creationDate.toISOString()
				};
			});
		});
	};
	const manageTwitchChatMessages = (channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
		if (channel === `#${twitchCredentials.value.connectedAs.name}`) {
			if (twitchChat.value.length > 50) {
				twitchChat.value.shift();
			}
			let savedMessage = {
				...msg,
				rawMessage: message,
				username: msg.userInfo.displayName,
				parsedMessage: msg.parseEmotes(),
				messageId: msg.id,
				messageTime: new Date().getTime(),
			}
			// @ts-ignore we've got slightly more than ChatMessageData but shh
			twitchChat.value.push(savedMessage);
		}
	};

	const onTwitchDeleteChatMessage = (channel: string, messageId: string) => {
		twitchChat.value = twitchChat.value.map((m: ChatMessageData) => {
			if (m.messageId === messageId) {
				m.parsedMessage = [
					{
						type: "text",
						text: "__REDACTED__",
						length: 12,
						position: 0,
					}
				]
				m.username = "USER PURGED"
			}
			return m;
		});
	};

	const onChatUserTimeout = (channel: string, user: string) => {
		twitchChat.value = twitchChat.value.map((m: ChatMessageData) => {
			if (m.username === user) {
				m.parsedMessage = [
					{
						type: "text",
						text: "_ _ REDACTED _ _",
						length: 12,
						position: 0,
					}
				]
				m.username = "USER PURGED"
			}
			return m;
		});
	};

	const twitchSubs: Replicant<{ username: string }[]> = nodecg.Replicant('twitchSubscribers', {defaultValue: []});
	const twitchFollows: Replicant<{ username: string }[]> = nodecg.Replicant('twitchFollowers', {defaultValue: []});

	nodecg.listenFor('refreshCredits', async (_val, ack) => {
		nodecg.log.info('refreshCredits');
		const subResult = twitchClient.subscriptions.getSubscriptions(twitchCredentials.value.connectedAs);
		const subs = await subResult;
		twitchSubs.value = subs.data
			.filter(v => v.userName !== twitchCredentials.value.connectedAs.name)
			.map(v => ({username: v.userDisplayName}));
		const followResult = twitchClient.users.getFollowsPaginated({followedUser: twitchCredentials.value.connectedAs});
		twitchFollows.value = await followResult.getAll()
			.then(r => r.map(f => ({username: f.userDisplayName})));
		// @ts-ignore
		ack(null, 'complete');
	});

	const onTwitchAuthSuccess = async () => {
		const {clientId, clientSecret} = twitchCredentials.value;

		const authProvider = new RefreshingAuthProvider(
			{
				clientId,
				clientSecret,
				onRefresh: async tokens => {
					nodecg.log.info('Refreshing Twitch Credentials');
					twitchCredentials.value.accessToken = tokens.accessToken;
					twitchCredentials.value.refreshToken = tokens.refreshToken;
					twitchCredentials.value.expiresIn = tokens.expiresIn;
					twitchCredentials.value.obtainmentTimestamp = tokens.obtainmentTimestamp;
				}
			},
			twitchCredentials.value,
		);
		twitchClient = new ApiClient({authProvider});
		await twitchClient.users.getMe().then(r => {
			twitchCredentials.value.connectedAs = {id: r.id, name: r.name};
			twitchCredentials.value.isConnected = true;
		});

		twitchPubSubClient = new SingleUserPubSubClient({authProvider});
		twitchPubSubListeners.onBits = await twitchPubSubClient.onBits(addTwitchPubSubEvent('bits'));
		// Currently not used on frontend, will need to make custom event manager
		// twitchPubSubListeners.onSubscription = await twitchPubSubClient.onSubscription(addTwitchPubSubEvent('subscription'));
		twitchPubSubListeners.onRedemption = await twitchPubSubClient.onRedemption(addTwitchPubSubEvent('redemption'));
		twitchPubSubListeners.onBitsBadgeUnlock = await twitchPubSubClient.onBitsBadgeUnlock(addTwitchPubSubEvent('bitsBadgeUnlock'));

		twitchChatClient = new ChatClient({channels: [twitchCredentials.value.connectedAs.name]});

		// twitchChatClient.onJoin((channel, user) => {
		// 	nodecg.log.info(`Twitch Chat: Connected to ${channel} as ${user}`);
		// });
		twitchChatClientListeners.onMessage = await twitchChatClient.onMessage(manageTwitchChatMessages);
		twitchChatClientListeners.onAction = await twitchChatClient.onAction(manageTwitchChatMessages);
		twitchChatClientListeners.onDelete = await twitchChatClient.onMessageRemove(onTwitchDeleteChatMessage);
		twitchChatClientListeners.onTimeout = await twitchChatClient.onTimeout(onChatUserTimeout);
		await twitchChatClient.connect();

		updateTwitchClips();
	}

	const onTwitchAuthLogout = async () => {
		await twitchPubSubListeners.onBits.remove();
		await twitchPubSubListeners.onSubscription.remove();
		await twitchPubSubListeners.onRedemption.remove();
		await twitchPubSubListeners.onBitsBadgeUnlock.remove();
		twitchCredentials.value.isConnected = false;
		delete twitchCredentials.value.connectedAs;
		twitchPubSubClient = undefined;
		twitchClient = undefined;
	}

	const twitchAuthRouter = getTwitchAuthRouter(nodecg, twitchCredentials, onTwitchAuthSuccess);

	nodecg.mount(`/${nodecg.bundleName}`, twitchAuthRouter);

	nodecg.listenFor('logoutTwitch', onTwitchAuthLogout);
	nodecg.listenFor('clearTwitchEvents', clearTwitchEvents);
	nodecg.listenFor('updateTwitchClips', updateTwitchClips);

	if (twitchCredentials.value.isConnected) onTwitchAuthSuccess().then(() => nodecg.log.info('Reconnected to Twitch'));
}

// noinspection JSUnusedGlobalSymbols
export default Bundle;
