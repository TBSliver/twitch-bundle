import {PubSubListener} from "twitch-pubsub-client";

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
