import {
    BundleAPI,
    ReplicantTwitchChat,
    ReplicantTwitchClips,
    ReplicantTwitchCredentials, ReplicantTwitchFollowers,
    ReplicantTwitchHello,
    ReplicantTwitchHelloIgnore,
    ReplicantTwitchSelectedClips, ReplicantTwitchSubscribers
} from "./types-server";
import {
    TWITCH_CHAT_REPLICANT,
    TWITCH_CLIPS_REPLICANT,
    TWITCH_CREDENTIAL_REPLICANT, TWITCH_FOLLOWERS_REPLICANT,
    TWITCH_HELLO_IGNORE_REPLICANT,
    TWITCH_HELLO_REPLICANT,
    TWITCH_SELECTED_CLIPS_REPLICANT, TWITCH_SUBSCRIBERS_REPLICANT
} from "./constants";

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

export function getTwitchHelloIgnoreReplicant(nodecg: BundleAPI): ReplicantTwitchHelloIgnore {
    return nodecg.Replicant(TWITCH_HELLO_IGNORE_REPLICANT, {defaultValue: []})
}

export function getTwitchClipsReplicant(nodecg: BundleAPI): ReplicantTwitchClips {
    return nodecg.Replicant(TWITCH_CLIPS_REPLICANT, {defaultValue: []});
}

export function getTwitchSelectedClipsReplicant(nodecg: BundleAPI): ReplicantTwitchSelectedClips {
    return nodecg.Replicant(TWITCH_SELECTED_CLIPS_REPLICANT, {defaultValue: {}});
}

export function getTwitchSubsReplicant(nodecg: BundleAPI): ReplicantTwitchSubscribers {
    return nodecg.Replicant(TWITCH_SUBSCRIBERS_REPLICANT, {defaultValue: []});
}

export function getTwitchFollowersReplicant(nodecg:BundleAPI): ReplicantTwitchFollowers {
    return nodecg.Replicant(TWITCH_FOLLOWERS_REPLICANT, {defaultValue: []});
}
