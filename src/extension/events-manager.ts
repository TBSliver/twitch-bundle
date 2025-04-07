import {BundleAPI} from "./types-server";
import {ApiClient} from "@twurple/api";
import {getTwitchEventsReplicant} from "./replicants";
import {EventSubWsListener} from "@twurple/eventsub-ws";
import {EventSubChannelRedemptionAddEvent, EventSubChannelCheerEvent} from "@twurple/eventsub-base";
import {V5CompatChannelRedemptionData, V5CompatData, EventSubData, V5CompatChannelCheerData} from "./types-common";
import dayjs from "dayjs";

export function getEventsManager(nodecg: BundleAPI, apiClient: ApiClient): EventSubWsListener {
    const twitchEvents = getTwitchEventsReplicant(nodecg);

    const addEvent = (messageName: string, _data: EventSubData, compatData: V5CompatData) => {
        nodecg.log.info(`Received message ${messageName}`);
        // for now, keep compatibility. proper data is unused
        twitchEvents.value.unshift({type: 'PubSub', messageName, data: compatData})
        nodecg.sendMessage(messageName, compatData);
    }

    const clearEvents = () => {
        twitchEvents.value = [];
    };

    const handleChannelRedemptionAdd = (data: EventSubChannelRedemptionAddEvent) => {
        // Compatibility for original pubsub setup
        const pubSubData: V5CompatChannelRedemptionData = {
            redemption: {
                user: {
                    login: data.userName,
                    display_name: data.userDisplayName,
                },
                reward: {
                    title: data.rewardTitle,
                    cost: data.rewardCost
                },
                user_input: data.input,
            },
            timestamp: dayjs(data.redemptionDate).toISOString(),
        };
        addEvent('redemption', data, pubSubData);
    }

    const handleChannelCheer = (data: EventSubChannelCheerEvent)=> {
        // Compatibility for original pubsub setup
        const pubSubData: V5CompatChannelCheerData = {
            chat_message: data.message,
            bits_used: data.bits,
            user_name: data.userName,
            time: dayjs().toISOString(),
            is_anonymous: data.isAnonymous,
        };
        addEvent('bits', data, pubSubData);
    }

    // https://twurple.js.org/versions/7.2/reference/eventsub-ws/classes/EventSubWsListener.html
    const listener = new EventSubWsListener({apiClient});

    listener.onChannelRedemptionAdd(nodecg.bundleConfig.twitchChatChannel, handleChannelRedemptionAdd);
    listener.onChannelCheer(nodecg.bundleConfig.twitchChatChannel, handleChannelCheer)

    listener.start();

    nodecg.listenFor('clearTwitchEvents', clearEvents);

    return listener;
}
