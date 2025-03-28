import {AccessToken, AuthProvider, RefreshingAuthProvider} from "@twurple/auth";
import {BundleAPI, ReplicantTwitchCredentials} from "./types-server";
import {TWITCH_CREDENTIAL_REPLICANT} from "./constants";
import {getCallbackUrl} from "./router/twitch-auth";
import {TwitchCredentialUser} from "./types-common";
import {writeFileSync, readFileSync} from "fs";

export function getAuthProvider(nodecg: BundleAPI): RefreshingAuthProvider {
    const twitchCredentials: ReplicantTwitchCredentials = nodecg.Replicant(TWITCH_CREDENTIAL_REPLICANT);

    // Simplify token storage
    const tokenFilePath = (userId: string) => `${nodecg.bundleConfig.twitchTokenStore}/tokens.${userId}.json`
    const writeTokenFile = (userId: string, token: AccessToken) => writeFileSync(tokenFilePath(userId), JSON.stringify(token, null, 4), 'utf-8');
    const readTokenFile = (userId: string): AccessToken => JSON.parse(readFileSync(tokenFilePath(userId), 'utf-8'))

    // Initialise provider
    const authProvider = new RefreshingAuthProvider({
        clientId: nodecg.bundleConfig.twitchClientId,
        clientSecret: nodecg.bundleConfig.twitchClientSecret,
        redirectUri: getCallbackUrl(nodecg),
    });

    // Store refresh tokens as needed
    authProvider.onRefresh((userId, token) => {
        nodecg.log.info(`Saving Twitch Credentials for ${userId}`);
        writeTokenFile(userId, token);
        twitchCredentials.value[userId].isConnected = true;
        // explicitly don't touch intents here, that's managed elsewhere.
    });

    // Set connected flag false on failure, allows for 'reconnection' or removal as needed
    authProvider.onRefreshFailure((userId, error) => {
        nodecg.log.error(`Error Refreshing Twitch Credentials for ${userId}: ${error}`)
        twitchCredentials.value[userId].isConnected = false;
    })

    // Re-connect all previous users
    // Called on restart of NodeCG
    Object.entries(twitchCredentials.value).forEach(([userId, credentials]: [string, TwitchCredentialUser]) => {
        // Only re-connect ones which have not been 'logged out'.
        if (credentials.isConnected) {
            nodecg.log.info(`Reconnecting to Twitch API for ${userId}`);
            authProvider.addUser(userId, readTokenFile(userId), credentials.intents);
        }
    });

    return authProvider;
}
