import {ParsedMessagePart} from "@twurple/chat";
import {EventSubChannelCheerEvent, EventSubChannelRedemptionAddEvent} from "@twurple/eventsub-base";

export interface BundleConfig {
    twitchClientId: string;
    twitchClientSecret: string;
    twitchTokenStore: string;
    twitchChatChannel: string;
    twitchChannelId: string;
}

export interface TwitchCredentialUser {
    name: string;
    isConnected: boolean;
    intents: string[];
}

export interface TwitchCredentials {
    [userId: string]: TwitchCredentialUser;
}

export interface ChatMessageData {
    username: string;
    messageTime: number;
    messageId: string;
    user_colour: string;
    user_badges: string[];
    parsedMessage: ParsedMessagePart[];
}

export interface TwitchHello {
    username: string;
    firstMessageTimestamp: number;
}

export interface TwitchClip {
    id: string;
    url: string;
    creator_name: string;
    title: string;
    created_at: string;
}

export interface TwitchSelectedClips {
    [id: string]: TwitchClip;
}

export interface TwitchChannelMember {
    username: string;
}

// twurple v5 Compatibility with original trigger data used in minions and droids
export interface V5CompatChannelRedemptionData {
    redemption: {
        user: {
            login: string;
            display_name: string;
        }
        reward: {
            title: string;
            cost: number;
        }
        user_input: string;
    }
    timestamp: string;
}

export interface V5CompatChannelCheerData {
    chat_message: string;
    bits_used: number;
    user_name: string;
    time: string;
    is_anonymous: boolean;
}

export type V5CompatData = V5CompatChannelRedemptionData | V5CompatChannelCheerData;

export type EventSubData = EventSubChannelRedemptionAddEvent | EventSubChannelCheerEvent;

export interface TwitchEvent {
    type: string;
    messageName: string;
    data: V5CompatData;
}

export interface TwitchRedemptionEvent extends TwitchEvent {
    data: V5CompatChannelRedemptionData;
}

export interface TwitchBitsEvent extends TwitchEvent {
    data: V5CompatChannelCheerData
}

export type UnionTwitchEvent = TwitchEvent | TwitchRedemptionEvent | TwitchBitsEvent;
