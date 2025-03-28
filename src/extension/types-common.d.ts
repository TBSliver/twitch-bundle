import {ParsedMessagePart, ChatMessage} from "@twurple/chat";

export interface BundleConfig {
    twitchClientId: string;
    twitchClientSecret: string;
    twitchTokenStore: string;
    twitchChatChannel: string;
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
    username: string,
    messageTime: number,
    messageId: string,
    user_colour: string,
    user_badges: string[],
    parsedMessage: ParsedMessagePart[],
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
    [id: string]: TwitchClip
}

export interface TwitchChannelMember {
    username: string
}
