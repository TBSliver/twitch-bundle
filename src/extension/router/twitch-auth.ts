import {NodeCG, Replicant} from "../../../../../types/server";
import URI from "urijs";
import {TwitchCredentials} from "../types";
import fetch from 'node-fetch';

export function getTwitchAuthRouter(nodecg: NodeCG, twitchCredentials: Replicant<TwitchCredentials>, onAuthSuccess: () => void) {
	// @ts-ignore
	const router = nodecg.Router();

	router.get('/authorize', nodecg.util.authCheck, (req: any, res: any) => {
		const uri = new URI('https://id.twitch.tv/oauth2/authorize')
			.addSearch("client_id", twitchCredentials.value.clientId)
			.addSearch("redirect_uri", getCallbackUrl(nodecg))
			.addSearch("response_type", "code")
			.addSearch("force_verify", "true")
			.addSearch("scope", "channel:read:subscriptions bits:read channel:read:redemptions channel_subscriptions");

		res.redirect(uri.toString());
	});

	router.get('/callback', (req: any, res: any) => {
		const uri = new URI('https://id.twitch.tv/oauth2/token')
			.addSearch("client_id", twitchCredentials.value.clientId)
			.addSearch("client_secret", twitchCredentials.value.clientSecret)
			.addSearch("code", req.query.code)
			.addSearch("redirect_uri", getCallbackUrl(nodecg))
			.addSearch("grant_type", "authorization_code");

		fetch(uri.toString(),
			{method: 'POST'})
			.then(res => res.json())
			.then(json => {
				twitchCredentials.value.accessToken = json.access_token;
				twitchCredentials.value.refreshToken = json.refresh_token;
				res.send('Success, you can now close this window!');
				onAuthSuccess();
			});
	});

	// @ts-ignore
	nodecg.listenFor('getAuthorizeUrl', (v, ack) => ack(null, getAuthorizeUrl(nodecg)));
	// @ts-ignore
	nodecg.listenFor('getCallbackUrl', (v, ack) => ack(null, getCallbackUrl(nodecg)));

	return router;
}

function getCallbackUrl(nodecg: NodeCG) {
	return new URI()
		.protocol(nodecg.config.ssl?.enabled ? 'https' : 'http')
		.host(nodecg.config.baseURL)
		.path(`${nodecg.bundleName}/callback`)
		.toString();
}

function getAuthorizeUrl(nodecg: NodeCG) {
	return new URI()
		.protocol(nodecg.config.ssl?.enabled ? 'https' : 'http')
		.host(nodecg.config.baseURL)
		.path(`${nodecg.bundleName}/authorize`)
		.toString();
}
