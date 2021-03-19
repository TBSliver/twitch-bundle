import { ApiClient } from 'twitch';
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';

function Bundle(nodecg) {
	const authProvider = getAuthProvider(nodecg);

	const apiClient = new ApiClient({authProvider});

}

function getAuthProvider(nodecg) {
	const twitchCredentials = nodecg.Replicant('twitchCredentials', {
		defaultValue: {
			clientId: undefined,
			clientSecret: undefined,
			accessToken: undefined,
			refreshToken: undefined,
			expiryTimestamp: undefined,
		}
	});

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
