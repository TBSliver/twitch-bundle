import {BundleAPI} from "./types-server";
import {ChatClient, ChatMessage, parseChatMessage} from "@twurple/chat";
import {getTwitchChatReplicant, getTwitchHelloIgnoreReplicant, getTwitchHelloReplicant} from "./replicants";
import {ChatMessageData} from "./types-common";
import {ApiClient, HelixChatBadgeSet} from "@twurple/api";
import {UPDATE_TWITCH_CHAT_BADGES_MESSAGE} from "./constants";

export function getChatClient(nodecg: BundleAPI, twitchClient: ApiClient): ChatClient {
    const twitchChat = getTwitchChatReplicant(nodecg);
    const twitchHello = getTwitchHelloReplicant(nodecg);
    const twitchHelloIgnore = getTwitchHelloIgnoreReplicant(nodecg);

    let twitchChatBadges: { [name: string]: HelixChatBadgeSet } = {};

    // Collect global and channel badges
    const updateChatBadges = async () => {
        const globalBadges = await twitchClient.chat.getGlobalBadges();
        const channelBadges = await twitchClient.chat.getChannelBadges(nodecg.bundleConfig.twitchChannelId);

        globalBadges.forEach(b => twitchChatBadges[b.id] = b);
        channelBadges.forEach(b => twitchChatBadges[b.id] = b);
    }

    if (Object.keys(twitchChatBadges).length == 0)
        updateChatBadges().then(() => nodecg.log.info("Updated Chat Badges"));

    nodecg.listenFor(UPDATE_TWITCH_CHAT_BADGES_MESSAGE, updateChatBadges);

    const getChatBadgeArray = (badgeMap: Map<string, string>) => {
        let badgeArray: string[] = [];
        badgeMap.forEach((badgeVer, badgeName) => {
            const badge = twitchChatBadges[badgeName];
            if (badge) {
                const version = badge.getVersion(badgeVer);
                badgeArray.push(version.getImageUrl(1));
            }
        })
        return badgeArray;
    }

    // Setup for anonymous connection
    const twitchChatClient = new ChatClient({channels: [nodecg.bundleConfig.twitchChatChannel]});

    const handleOnMessage = (channel: string, _user: string, _text: string, msg: ChatMessage) => {
        nodecg.log.info(channel, parseChatMessage(msg.text, msg.emoteOffsets))
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
                user_badges: getChatBadgeArray(msg.userInfo.badges),
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
