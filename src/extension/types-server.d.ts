import NodeCG from "nodecg/types";
import {BundleConfig, ChatMessageData, TwitchCredentials, TwitchHello} from "./types-common";

type ReplicantTwitchCredentials = NodeCG.ServerReplicant<TwitchCredentials>;
type BundleAPI = NodeCG.ServerAPI<BundleConfig>;
type ReplicantTwitchChat = NodeCG.ServerReplicant<ChatMessageData[]>;
type ReplicantTwitchHello = NodeCG.ServerReplicant<TwitchHello[]>;
type ReplicantTwitchHelloIgnore = NodeCG.ServerReplicant<string[]>;
