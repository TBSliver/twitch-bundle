import {RefreshableAuthProvider, StaticAuthProvider} from 'twitch-auth';
import {NodeCG, Replicant} from '../../../../types/server';
import * as URI from 'urijs';
import * as ncgUtils from '../../../../lib/util';

function Bundle(nodecg: NodeCG) {
	const twitchCredentials = nodecg.Replicant('twitchCredentials', {
		defaultValue: {
			clientId: undefined,
			clientSecret: undefined,
			accessToken: undefined,
			refreshToken: undefined,
			expiryTimestamp: undefined,
		}
	});

	const router = nodecg.Router;

	router.get('/authorize', ncgUtils.authCheck, (req: any, res: any) => {
		const uri = new URI('https://id.twitch.tv/oauth2/authorize')
			.addSearch("client_id", twitchCredentials.value.clientId)
			.addSearch("redirect_uri", getCallbackUrl(nodecg))
			.addSearch("response_type", "code")
			.addSearch("grant_type", "authorization_code")
			.addSearch("scope", "channel_subscriptions+bits:read+channel:read:redemptions");

		res.redirect(uri.toString());
	});

	nodecg.mount(router);

	nodecg.listenFor('logoutTwitch', async () => {
		// remove tokens and stop listeners

	})
}

function getCallbackUrl(nodecg: NodeCG) {
	return new URI()
		.protocol(nodecg.config.ssl ? 'https' : 'http')
		.host(nodecg.config.baseURL)
		.path(`${nodecg.bundleName}/callback`)
		.toString();
}

function getAuthProvider(nodecg: NodeCG, twitchCredentials: Replicant<any>) {


	const {clientId, clientSecret, accessToken, refreshToken, expiryTimestamp} = twitchCredentials.value;

	return new RefreshableAuthProvider(
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
}

// noinspection JSUnusedGlobalSymbols
export default Bundle;
