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
import {ApiClient, HelixChatBadgeSet} from "@twurple/api";
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

interface TwitchHello {
	username: string;
	firstMessageTimestamp: number;
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
	let twitchPubSubClient: SingleUserPubSubClient;
	let twitchChatClient;
	let twitchPubSubListeners: TwitchPubSubListeners = {};
	let twitchChatClientListeners: TwitchChatClientListeners = {};
	let twitchChatBadges: { [name: string]: HelixChatBadgeSet } = {};

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

	const twitchHello: Replicant<TwitchHello[]> = nodecg.Replicant('twitchHello', {defaultValue: []});
	const twitchHelloIgnore: Replicant<string[]> = nodecg.Replicant('twitchHelloIgnore', {defaultValue: []});

	const checkHello = (message: any) => {
		const userIndex = twitchHello.value.findIndex(e => e.username === message.username);
		if (userIndex >= 0) return;
		if (twitchHelloIgnore.value.includes(message.username)) return;
		twitchHello.value.push({
			username: message.username,
			firstMessageTimestamp: message.messageTime,
		});
	}

	const getChatBadgeArray = (badgeMap: Map<string, string>) => {
		let badgeArray: string[] = [];
		badgeMap.forEach((badgeVer, badgeName) => {
			const badge = twitchChatBadges[badgeName];
			if (badge) {
				const version = badge.getVersion(badgeVer);
				badgeArray.push(version.getImageUrl(1));
			}
		})
		return badgeArray;
	}

	const manageTwitchChatMessages = (channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
		if (channel === `#${twitchCredentials.value.connectedAs.name}`) {
			if (twitchChat.value.length > 50) {
				twitchChat.value.shift();
			}
			let savedMessage = {
				...msg,
				rawMessage: message,
				username: msg.userInfo.displayName,
				user_colour: msg.userInfo.color,
				user_badges: getChatBadgeArray(msg.userInfo.badges),
				parsedMessage: msg.parseEmotes(),
				messageId: msg.id,
				messageTime: new Date().getTime(),
			}
			// @ts-ignore we've got slightly more than ChatMessageData but shh
			twitchChat.value.push(savedMessage);
			checkHello(savedMessage);
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
		twitchChatClientListeners.onMessage = twitchChatClient.onMessage(manageTwitchChatMessages);
		twitchChatClientListeners.onAction = twitchChatClient.onAction(manageTwitchChatMessages);
		twitchChatClientListeners.onDelete = twitchChatClient.onMessageRemove(onTwitchDeleteChatMessage);
		twitchChatClientListeners.onTimeout = twitchChatClient.onTimeout(onChatUserTimeout);
		await twitchChatClient.connect();

		const globalBadges = await twitchClient.chat.getGlobalBadges();
		const channelBadges = await twitchClient.chat.getChannelBadges(twitchCredentials.value.connectedAs);

		globalBadges.forEach(b => twitchChatBadges[b.id] = b);
		channelBadges.forEach(b => twitchChatBadges[b.id] = b);

		updateTwitchClips();
	}

	const onTwitchAuthLogout = async () => {
		twitchPubSubListeners.onBits = undefined;
		twitchPubSubListeners.onSubscription = undefined;
		twitchPubSubListeners.onRedemption = undefined;
		twitchPubSubListeners.onBitsBadgeUnlock = undefined;
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
