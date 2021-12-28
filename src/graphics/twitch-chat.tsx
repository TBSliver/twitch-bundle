import React, {useEffect, useState} from 'react';
import {render} from 'react-dom';
import './twitch-chat.css';
import {useReplicant} from "use-nodecg";
import {ParsedMessagePart} from '@twurple/common';

interface ChatMessageData {
	username: string,
	messageTime: string,
	messageId: string,
	parsedMessage: [ParsedMessagePart],
}

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
	const [twitchChat] = useReplicant<Array<ChatMessageData>>('twitchChat', []);
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
render(<App/>, rootElement);
