import NodeCG from "nodecg/types";
import {BundleConfig, TwitchCredentials} from "./types-common";

type ReplicantTwitchCredentials = NodeCG.ServerReplicant<TwitchCredentials>;
type BundleAPI = NodeCG.ServerAPI<BundleConfig>;
