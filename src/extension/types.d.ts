import {
	PubSubBitsBadgeUnlockMessage,
	PubSubBitsMessage,
	PubSubListener,
	PubSubRedemptionMessage
} from "@twurple/pubsub";
import {PubSubSubscriptionMessageData} from "@twurple/pubsub/lib/messages/PubSubSubscriptionMessage";
import {PubSubRedemptionMessageContent} from "@twurple/pubsub/lib/messages/PubSubRedemptionMessage";
import {PubSubBitsMessageContent} from "@twurple/pubsub/lib/messages/PubSubBitsMessage";
import {PubSubBitsBadgeUnlockMessageContent} from "@twurple/pubsub/lib/messages/PubSubBitsBadgeUnlockMessage";
import type {Listener} from "@d-fischer/typed-event-emitter";

export type PubSubEventMessage = PubSubBitsMessage | PubSubRedemptionMessage | PubSubBitsBadgeUnlockMessage;
export type PubSubEventMessageContent =
	PubSubBitsMessageContent
	| PubSubRedemptionMessageContent
	| PubSubBitsBadgeUnlockMessageContent;

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
	expiresIn: number;
	obtainmentTimestamp: number;
}

export interface TwitchPubSubListeners {
	onBitsBadgeUnlock?: PubSubListener<never>;
	onSubscription?: PubSubListener<never>;
	onBits?: PubSubListener<never>;
	onRedemption?: PubSubListener<never>;
}

export interface TwitchChatClientListeners {
	onAction?: Listener;
	onTimeout?: Listener;
	onDelete?: Listener;
	onMessage?: Listener;
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
	// | TwitchSubscriptionEvent
	| TwitchBitsBadgeEvent;

export interface TwitchEvent {
	type: string;
	messageName: string;
	data: PubSubEventMessageContent;
}

export interface TwitchClip {
	id: string;
	url: string;
	creator_name: string;
	title: string;
	created_at: string;
}
