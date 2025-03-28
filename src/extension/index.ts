import NodeCG from 'nodecg/types';
import {getTwitchAuthRouter} from "./router/twitch-auth";
import {
    PubSubEventMessage,
    TwitchEvent,
    TwitchPubSubListeners
} from "./types";
import {ApiClient} from "@twurple/api";
import {SingleUserPubSubClient} from '@twurple/pubsub';
import {rawDataSymbol} from '@twurple/common';
import {BundleAPI} from "./types-server";
import {getAuthProvider} from "./auth-provider";
import {getTwitchCredentialReplicant} from "./replicants";
import {getChatClient} from "./chat-client";
import {getClipsManager} from "./clips-manager";
import {getCreditsManager} from "./credits-manager";

function Bundle(nodecg: BundleAPI) {

    // Initialise Credentials Replicants
    const twitchCredentials = getTwitchCredentialReplicant(nodecg);

    // Initialise Twitch API connection
    const authProvider = getAuthProvider(nodecg);
    const twitchClient = new ApiClient({authProvider});

    // Also fetch the user id and set it up as needed
    authProvider.onRefresh((userId, _t) => {
        twitchClient.users.getUserById(userId).then(v => {
            twitchCredentials.value[userId].name = v.displayName
        })
    });

    // Initialise Twitch Auth Callbacks
    getTwitchAuthRouter(nodecg, authProvider);

    // Setup Twitch Chat integration
    getChatClient(nodecg, twitchClient);

    // Setup Clips Manager
    getClipsManager(nodecg, twitchClient);

    getCreditsManager(nodecg, twitchClient);








    const twitchEvents: NodeCG.ServerReplicant<TwitchEvent[]> = nodecg.Replicant('twitchEvents', {defaultValue: []});




    let twitchPubSubClient: SingleUserPubSubClient;
    let twitchPubSubListeners: TwitchPubSubListeners = {};

    const addTwitchPubSubEvent = (messageName: string) => (data: PubSubEventMessage) => {
        nodecg.log.info(`Received message ${messageName}`);
        nodecg.log.info(`Raw Data: ${JSON.stringify(data[rawDataSymbol].data, null, 4)}`);
        twitchEvents.value.unshift({type: 'PubSub', messageName, data: data[rawDataSymbol].data});
        nodecg.sendMessage(messageName, data[rawDataSymbol].data);
    };
    const clearTwitchEvents = () => {
        twitchEvents.value = []
    };

    const onTwitchAuthSuccess = async () => {
        twitchPubSubClient = new SingleUserPubSubClient({authProvider});
        twitchPubSubListeners.onBits = await twitchPubSubClient.onBits(addTwitchPubSubEvent('bits'));
        // Currently not used on frontend, will need to make custom event manager
        // twitchPubSubListeners.onSubscription = await twitchPubSubClient.onSubscription(addTwitchPubSubEvent('subscription'));
        twitchPubSubListeners.onRedemption = await twitchPubSubClient.onRedemption(addTwitchPubSubEvent('redemption'));
        twitchPubSubListeners.onBitsBadgeUnlock = await twitchPubSubClient.onBitsBadgeUnlock(addTwitchPubSubEvent('bitsBadgeUnlock'));
    }

    const onTwitchAuthLogout = async () => {
        twitchPubSubListeners.onBits = undefined;
        twitchPubSubListeners.onSubscription = undefined;
        twitchPubSubListeners.onRedemption = undefined;
        twitchPubSubListeners.onBitsBadgeUnlock = undefined;
        twitchPubSubClient = undefined;
    }

    nodecg.listenFor('logoutTwitch', onTwitchAuthLogout);
    nodecg.listenFor('clearTwitchEvents', clearTwitchEvents);
}

// noinspection JSUnusedGlobalSymbols
export default Bundle;
