import {RefreshableAuthProvider, StaticAuthProvider} from 'twitch-auth';
import {NodeCG, Replicant} from '../../../../types/server';
import {getTwitchAuthRouter} from "./router/twitch-auth";
import {TwitchCredentials, TwitchPubSubListeners} from "./types";
import {ApiClient} from "twitch";
import {SingleUserPubSubClient} from 'twitch-pubsub-client';

function Bundle(nodecg: NodeCG) {
	const twitchCredentials: Replicant<TwitchCredentials> = nodecg.Replicant('twitchCredentials', {
		defaultValue: {
			clientId: undefined,
			clientSecret: undefined,
			accessToken: undefined,
			refreshToken: undefined,
			expiryTimestamp: undefined,
			connectedAs: undefined,
			isConnected: false,
		}
	});
	let twitchClient;
	let twitchPubSubClient;
	let twitchPubSubListeners: TwitchPubSubListeners = {};

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
		twitchClient.helix.users.getMe().then(r => {
			twitchCredentials.value.connectedAs = {id: r.id, name: r.name};
			twitchCredentials.value.isConnected = true;
		});

		twitchPubSubClient = new SingleUserPubSubClient({twitchClient});
		twitchPubSubListeners.onBits = await twitchPubSubClient.onBits(message => nodecg.sendMessage('bits', message));
		twitchPubSubListeners.onSubscription = await twitchPubSubClient.onSubscription(message => nodecg.sendMessage('subscription', message));
		twitchPubSubListeners.onRedemption = await twitchPubSubClient.onRedemption(message => nodecg.sendMessage('redemption', message));
		twitchPubSubListeners.onBitsBadgeUnlock = await twitchPubSubClient.onBitsBadgeUnlock(message => nodecg.sendMessage('bitsBadgeUnlock', message));
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

	if (twitchCredentials.value.isConnected) onTwitchAuthSuccess().then(() => nodecg.log.info('Reconnected to Twitch'));
}

// noinspection JSUnusedGlobalSymbols
export default Bundle;
