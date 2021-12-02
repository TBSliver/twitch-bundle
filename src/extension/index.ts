import {RefreshableAuthProvider, StaticAuthProvider} from 'twitch-auth';
import {NodeCG, Replicant} from '../../../../types/server';
import {getTwitchAuthRouter} from "./router/twitch-auth";
import {TwitchClip, TwitchCredentials, TwitchEvent, TwitchPubSubListeners} from "./types";
import {ApiClient} from "twitch";
import {SingleUserPubSubClient} from 'twitch-pubsub-client';

function Bundle(nodecg: NodeCG) {
	const twitchCredentials: Replicant<TwitchCredentials> = nodecg.Replicant('twitchCredentials', {
		defaultValue: {
			clientId: '',
			clientSecret: '',
			accessToken: undefined,
			refreshToken: undefined,
			expiryTimestamp: undefined,
			connectedAs: undefined,
			isConnected: false,
		}
	});
	const twitchEvents: Replicant<TwitchEvent[]> = nodecg.Replicant('twitchEvents', {defaultValue: []});
	const twitchClips: Replicant<TwitchClip[]> = nodecg.Replicant('twitchClips', {defaultValue: []});
	nodecg.Replicant<{ [id: string]: TwitchClip }>('twitchSelectedClips', {defaultValue: {}});

	let twitchClient: ApiClient;
	let twitchPubSubClient;
	let twitchPubSubListeners: TwitchPubSubListeners = {};

	const addTwitchPubSubEvent = (messageName: string) => (data: any) => {
		nodecg.log.info(`Received message ${messageName}`);
		twitchEvents.value.unshift({type: 'PubSub', messageName, data: data._data.data});
		nodecg.sendMessage(messageName, data._data.data);
	};
	const clearTwitchEvents = () => {
		twitchEvents.value = []
	};
	const updateTwitchClips = () => {
		if (!twitchCredentials.value.connectedAs)
			return;

		twitchClient.helix.clips.getClipsForBroadcasterPaginated(twitchCredentials.value.connectedAs, {limit: 100}).getAll().then(clips => {
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

	const onTwitchAuthSuccess = async () => {
		const {clientId, clientSecret, accessToken, refreshToken, expiryTimestamp} = twitchCredentials.value;

		const authProvider = new RefreshableAuthProvider(
			new StaticAuthProvider(clientId, accessToken),
			{
				clientSecret,
				refreshToken,
				expiry: expiryTimestamp === null ? null : new Date(expiryTimestamp),
				onRefresh: async tokens => {
					nodecg.log.info('Refreshing Twitch Credentials');
					twitchCredentials.value.accessToken = tokens.accessToken;
					twitchCredentials.value.refreshToken = tokens.refreshToken;
					twitchCredentials.value.expiryTimestamp = tokens.expiryDate === null ? null : tokens.expiryDate.getTime();
				}
			}
		);
		twitchClient = new ApiClient({authProvider});
		await twitchClient.helix.users.getMe().then(r => {
			twitchCredentials.value.connectedAs = {id: r.id, name: r.name};
			twitchCredentials.value.isConnected = true;
		});

		twitchPubSubClient = new SingleUserPubSubClient({twitchClient});
		twitchPubSubListeners.onBits = await twitchPubSubClient.onBits(addTwitchPubSubEvent('bits'));
		twitchPubSubListeners.onSubscription = await twitchPubSubClient.onSubscription(addTwitchPubSubEvent('subscription'));
		twitchPubSubListeners.onRedemption = await twitchPubSubClient.onRedemption(addTwitchPubSubEvent('redemption'));
		twitchPubSubListeners.onBitsBadgeUnlock = await twitchPubSubClient.onBitsBadgeUnlock(addTwitchPubSubEvent('bitsBadgeUnlock'));

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
