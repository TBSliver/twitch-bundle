import {PubSubListener} from "twitch-pubsub-client";
import {PubSubSubscriptionMessageData} from "twitch-pubsub-client/lib/Messages/PubSubSubscriptionMessage";
import {PubSubRedemptionMessageContent} from "twitch-pubsub-client/lib/Messages/PubSubRedemptionMessage";
import {PubSubBitsMessageContent} from "twitch-pubsub-client/lib/Messages/PubSubBitsMessage";
import {PubSubBitsBadgeUnlockMessageContent} from "twitch-pubsub-client/lib/Messages/PubSubBitsBadgeUnlockMessage";

interface TwitchCredentialConnectedAs {
	id: string;
	name: string;
}

export interface TwitchCredentials {
	isConnected: boolean;
	connectedAs?: TwitchCredentialConnectedAs;
	clientId: string;
	clientSecret: string;
	accessToken: string;
	refreshToken: string;
	expiryTimestamp: number;
}

export interface TwitchPubSubListeners {
	onBitsBadgeUnlock?: PubSubListener<never>;
	onSubscription?: PubSubListener<never>;
	onBits?: PubSubListener<never>;
	onRedemption?: PubSubListener<never>;
}

export interface TwitchRedemptionEvent {
	type: string;
	messageName: string;
	data: PubSubRedemptionMessageContent;
}

export interface TwitchBitsEvent {
	type: string;
	messageName: string;
	data: PubSubBitsMessageContent;
}

export interface TwitchSubscriptionEvent {
	type: string;
	messageName: string;
	data: PubSubSubscriptionMessageData;
}

export interface TwitchBitsBadgeEvent {
	type: string;
	messageName: string;
	data: PubSubBitsBadgeUnlockMessageContent;
}

export type TwitchPubSubEvent = TwitchRedemptionEvent
	| TwitchBitsEvent
	| TwitchSubscriptionEvent
	| TwitchBitsBadgeEvent;

export type TwitchEvent = TwitchPubSubEvent;

export interface TwitchClip {
	id: string;
	url: string;
	creator_name: string;
	title: string;
	created_at: string;
}
