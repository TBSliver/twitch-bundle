import {BundleAPI} from "./types-server";
import {getTwitchFollowersReplicant, getTwitchSubsReplicant} from "./replicants";
import {REFRESH_CREDITS_MESSAGE} from "./constants";
import {ApiClient} from "@twurple/api";
import {TwitchChannelMember} from "./types-common";
import NodeCG from "nodecg/types";

export function getCreditsManager(nodecg: BundleAPI, twitchClient: ApiClient) {
    const twitchSubs = getTwitchSubsReplicant(nodecg);
    const twitchFollows = getTwitchFollowersReplicant(nodecg);

    const handleRefreshCredits = async (_val: null, ack: NodeCG.UnhandledAcknowledgement) => {
        nodecg.log.info('Refreshing Credits');

        // get sub list
        const tempSubList: TwitchChannelMember[] = [];
        const subResult = twitchClient.subscriptions.getSubscriptionsPaginated(nodecg.bundleConfig.twitchChannelId);
        for await (const sub of subResult) {
            if (sub.userName == nodecg.bundleConfig.twitchChatChannel)
                continue;
            tempSubList.push({username: sub.userDisplayName});
        }
        twitchSubs.value = tempSubList;

        // get follower list
        const tempFollowList: TwitchChannelMember[] = [];
        const followResult = twitchClient.channels.getChannelFollowersPaginated(nodecg.bundleConfig.twitchChannelId);
        for await (const follow of followResult) {
            tempFollowList.push({username: follow.userDisplayName});
        }
        twitchFollows.value = tempFollowList;

        ack(null, 'complete');
    }

    nodecg.listenFor(REFRESH_CREDITS_MESSAGE, handleRefreshCredits);
}
