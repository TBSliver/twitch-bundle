export interface BundleConfig {
    twitchClientId: string;
    twitchClientSecret: string;
    twitchTokenStore: string;
}

export interface TwitchCredentialUser {
    name: string;
    isConnected: boolean;
    intents: string[];
}

export interface TwitchCredentials {
    [userId: string]: TwitchCredentialUser;
}
