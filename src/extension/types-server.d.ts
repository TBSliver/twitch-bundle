import NodeCG from "nodecg/types";
import {
    BundleConfig,
    ChatMessageData, TwitchChannelMember,
    TwitchClip,
    TwitchCredentials,
    TwitchHello,
    TwitchSelectedClips,
    TwitchEvent
} from "./types-common";

type ReplicantTwitchCredentials = NodeCG.ServerReplicant<TwitchCredentials>;
type BundleAPI = NodeCG.ServerAPI<BundleConfig>;
type ReplicantTwitchChat = NodeCG.ServerReplicant<ChatMessageData[]>;
type ReplicantTwitchHello = NodeCG.ServerReplicant<TwitchHello[]>;
type ReplicantTwitchHelloIgnore = NodeCG.ServerReplicant<string[]>;
type ReplicantTwitchClips = NodeCG.ServerReplicant<TwitchClip[]>;
type ReplicantTwitchSelectedClips = NodeCG.ServerReplicant<TwitchSelectedClips>;
type ReplicantTwitchSubscribers = NodeCG.ServerReplicant<TwitchChannelMember[]>;
type ReplicantTwitchFollowers = NodeCG.ServerReplicant<TwitchChannelMember[]>;
type ReplicantTwitchEvents = NodeCG.ServerReplicant<TwitchEvent[]>;
