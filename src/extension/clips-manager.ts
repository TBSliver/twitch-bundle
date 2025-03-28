import {BundleAPI} from "./types-server";
import {ApiClient} from "@twurple/api";
import {getTwitchClipsReplicant, getTwitchSelectedClipsReplicant} from "./replicants";
import {TwitchClip} from "./types-common";
import {UPDATE_TWITCH_CLIPS_MESSAGE} from "./constants";

export function getClipsManager(nodecg: BundleAPI, twitchClient: ApiClient) {
    const twitchClips = getTwitchClipsReplicant(nodecg);
    getTwitchSelectedClipsReplicant(nodecg);

    const updateTwitchClips = async () => {
        const newClipArray: TwitchClip[] = [];
        const allClips = twitchClient.clips.getClipsForBroadcasterPaginated(nodecg.bundleConfig.twitchChatChannel);
        for await (const clip of allClips) {
            newClipArray.push({
                id: clip.id,
                url: clip.thumbnailUrl.replace("-preview-480x272.jpg", ".mp4"),
                created_at: clip.creationDate.toISOString(),
                creator_name: clip.creatorDisplayName,
                title: clip.title
            })
        }
        newClipArray.sort((a, b) => {
            if (a.created_at > b.created_at)
                return 1;
            if (a.created_at < b.created_at)
                return -1;
            return 0;
        });
        twitchClips.value = newClipArray;
    };

    nodecg.listenFor(UPDATE_TWITCH_CLIPS_MESSAGE, updateTwitchClips);
}
