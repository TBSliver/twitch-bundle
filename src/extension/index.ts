import {getTwitchAuthRouter} from "./router/twitch-auth";
import {ApiClient} from "@twurple/api";
import {BundleAPI} from "./types-server";
import {getAuthProvider} from "./auth-provider";
import {getTwitchCredentialReplicant} from "./replicants";
import {getChatClient} from "./chat-client";
import {getClipsManager} from "./clips-manager";
import {getCreditsManager} from "./credits-manager";
import {getEventsManager} from "./events-manager";

function Bundle(nodecg: BundleAPI) {

    // Initialise Credentials Replicants
    const twitchCredentials = getTwitchCredentialReplicant(nodecg);

    // Initialise Twitch API connection
    const authProvider = getAuthProvider(nodecg);
    const twitchClient = new ApiClient({authProvider});

    // Also fetch the user id and set it up as needed
    authProvider.onRefresh(async (userId, _t) => {
        nodecg.log.info("Refreshing Display Names");
        twitchClient.users.getUserById(userId).then(v => {
            twitchCredentials.value[userId].name = v.displayName
        })
    });

    // Initialise Twitch Auth Callbacks
    getTwitchAuthRouter(nodecg, authProvider);

    // Setup Other integrations
    // getChatClient(nodecg, twitchClient);
    // getClipsManager(nodecg, twitchClient);
    // getCreditsManager(nodecg, twitchClient);
    // getEventsManager(nodecg, twitchClient);
}

// noinspection JSUnusedGlobalSymbols
export default Bundle;
