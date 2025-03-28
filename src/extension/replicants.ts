import {BundleAPI, ReplicantTwitchChat, ReplicantTwitchCredentials, ReplicantTwitchHello} from "./types-server";
import {TWITCH_CHAT_REPLICANT, TWITCH_CREDENTIAL_REPLICANT, TWITCH_HELLO_REPLICANT} from "./constants";

export function getTwitchCredentialReplicant(nodecg: BundleAPI): ReplicantTwitchCredentials {
    const twitchCredentials: ReplicantTwitchCredentials = nodecg.Replicant(TWITCH_CREDENTIAL_REPLICANT, {defaultValue: {}});

    // Migrate from v1 - actually just deletes everything because we store things differently now
    // This won't collide, as this is now keyed on the actual User ID which is a numerical string
    delete twitchCredentials.value.isConnected;
    delete twitchCredentials.value.connectedAs;
    delete twitchCredentials.value.clientId;
    delete twitchCredentials.value.clientSecret;
    delete twitchCredentials.value.accessToken;
    delete twitchCredentials.value.refreshToken;
    delete twitchCredentials.value.expiresIn;
    delete twitchCredentials.value.obtainmentTimestamp;

    return twitchCredentials;
}

export function getTwitchChatReplicant(nodecg: BundleAPI): ReplicantTwitchChat {
    return nodecg.Replicant(TWITCH_CHAT_REPLICANT, {defaultValue: []});
}

export function getTwitchHelloReplicant(nodecg: BundleAPI): ReplicantTwitchHello {
    return nodecg.Replicant(TWITCH_HELLO_REPLICANT, {defaultValue: []});
}
