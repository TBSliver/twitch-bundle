import {BundleAPI} from "./types-server";
import {ChatClient, ChatMessage, parseChatMessage} from "@twurple/chat";
import {getTwitchChatReplicant, getTwitchHelloIgnoreReplicant, getTwitchHelloReplicant} from "./replicants";
import {ChatMessageData} from "./types-common";

export function getChatClient(nodecg: BundleAPI): ChatClient {
    const twitchChat = getTwitchChatReplicant(nodecg);
    const twitchHello = getTwitchHelloReplicant(nodecg);
    const twitchHelloIgnore = getTwitchHelloIgnoreReplicant(nodecg);

    // Setup for anonymous connection
    const twitchChatClient = new ChatClient({channels: [nodecg.bundleConfig.twitchChatChannel]});

    const handleOnMessage = (channel: string, _user: string, _text: string, msg: ChatMessage) => {
        // Ignore anything but messages for our channel
        if (channel === `#${nodecg.bundleConfig.twitchChatChannel}`) {
            // Only store 50 messages
            if (twitchChat.value.length > 50) {
                twitchChat.value.shift();
            }
            // Build new object
            const savedMessage: ChatMessageData = {
                messageId: msg.id,
                username: msg.userInfo.displayName,
                messageTime: msg.date.getTime(),
                user_colour: msg.userInfo.color,
                user_badges: [],
                parsedMessage: parseChatMessage(msg.text, msg.emoteOffsets)
            }
            twitchChat.value.push(savedMessage);

            // Twitch Hello Queue functionality
            // If they're in the ignore queue, skip the rest
            if (twitchHelloIgnore.value.includes(savedMessage.username)) return;
            // Check if user already in hello queue
            const userIndex = twitchHello.value.findIndex(e => e.username === savedMessage.username);
            // Skip if already in it
            if (userIndex >= 0) return;
            // Add to the hello queue
            twitchHello.value.push({username: savedMessage.username, firstMessageTimestamp: savedMessage.messageTime})
        }
    };

    const handleOnMessageRemove = (_channel: string, messageId: string) => {
        twitchChat.value = twitchChat.value.map((m) => {
            if (m.messageId === messageId) {
                m.parsedMessage = [
                    {
                        type: "text",
                        text: "__REDACTED__",
                        length: 12,
                        position: 0,
                    }
                ]
                m.username = "USER PURGED"
            }
            return m;
        });
    };

    const handleOnTimeout = (_channel: string, user: string) => {
        twitchChat.value = twitchChat.value.map((m: ChatMessageData) => {
            if (m.username === user) {
                m.parsedMessage = [
                    {
                        type: "text",
                        text: "__REDACTED__",
                        length: 12,
                        position: 0,
                    }
                ]
                m.username = "USER PURGED"
            }
            return m;
        });
    };

    // Handle all the things
    twitchChatClient.onMessage(handleOnMessage)
    twitchChatClient.onAction(handleOnMessage)
    twitchChatClient.onMessageRemove(handleOnMessageRemove)
    twitchChatClient.onTimeout(handleOnTimeout)

    // Finally, connect!
    twitchChatClient.connect();

    return twitchChatClient;
}
