import React from 'react';
import {createRoot} from "react-dom/client";
import './twitch-chat.css';
import {useReplicant} from "@nodecg/react-hooks";
import {ParsedMessagePart} from '@twurple/chat';
import {ChatMessageData} from "../extension/types-common";
import {TWITCH_CHAT_REPLICANT} from "../extension/constants";

interface ChatMessage {
    message: ChatMessageData;
}

function ChatMessage({message}: ChatMessage) {
    return (
        <div className={"message-container"}>
            <span className={"username"}>{message.username}: </span>
            <span className={"message"}>
				{message.parsedMessage.map((messagePart: ParsedMessagePart) => {
                    if (messagePart.type === 'text')
                        return messagePart.text;
                    if (messagePart.type === 'emote')
                        return <img alt={"emote"}
                                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${messagePart.id}/default/dark/1.0`}/>
                })}
			</span>
        </div>
    );
}

function App() {
    const [twitchChat] = useReplicant<ChatMessageData[]>(TWITCH_CHAT_REPLICANT, {defaultValue: []});
    console.log(twitchChat);

    return (
        <>
            <div className={"chat-messages"}>
                {twitchChat.map((t: any) => (
                    <ChatMessage message={t} key={t.messageId}/>
                ))}
            </div>
        </>
    );
}

const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<App/>);
