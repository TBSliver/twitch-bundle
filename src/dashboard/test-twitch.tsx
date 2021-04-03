import React, {FormEvent, useState} from 'react';
import {render} from 'react-dom';
import './test-twitch.css';
import {DownChevronIcon} from "./components/icon";
import {PubSubBitsMessageContent} from "twitch-pubsub-client/lib/Messages/PubSubBitsMessage";
import {PubSubRedemptionMessageContent} from "twitch-pubsub-client/lib/Messages/PubSubRedemptionMessage";

const rawBitData: PubSubBitsMessageContent = {
	"user_name": "testUser",
	"channel_name": "testChannel",
	"user_id": "123456789",
	"channel_id": "123456789",
	"time": "2021-04-02T00:00:00.000000000Z",
	"chat_message": "Test Bit Message Cheer1",
	"bits_used": 20,
	"total_bits_used": 600,
	"is_anonymous": false,
	"context": "cheer",
	"badge_entitlement": null
};

function TestBits() {
	const [showBody, setShowBody] = useState(false);
	const handleShowBody = () => setShowBody(prev => !prev);

	const [testData, setTestData] = useState(rawBitData);

	const handleChange = (event: FormEvent<HTMLInputElement>) => {
		setTestData({...testData, [event.currentTarget.name]: event.currentTarget.value});
	}
	const handleSendMessage = () => nodecg.sendMessage('bits', testData);

	return (
		<>
			<div className="test-section">
				<div className="test-header">
					<div className="test-header-title">
						Test Bits
					</div>
					<div className="test-header-buttons">
						<div onClick={handleShowBody}><DownChevronIcon/></div>
					</div>
				</div>
				{showBody && (
					<div className="test-body">
						<label htmlFor="user-name">User Name</label>
						<input id="user-name" name="user_name" value={testData.user_name} onChange={handleChange}/>
						<label htmlFor="bits-used">Bits Amount</label>
						<input id="bits-used" name="bits_used" value={testData.bits_used} type="number"
							   onChange={handleChange}/>
						<label htmlFor="chat-message">Chat Message</label>
						<input id="chat-message" name="chat_message" value={testData.chat_message}
							   onChange={handleChange}/>
						<button className="twitch" onClick={handleSendMessage}>Send</button>
					</div>
				)}
			</div>
		</>
	)
}

const rawRedemptionData: PubSubRedemptionMessageContent = {
	"timestamp": "2021-04-02T16:37:00.813078473Z",
	"redemption": {
		"id": "82edc824-930b-4d0d-b350-92ea360c6706",
		"user": {
			"id": "123456789",
			"login": "testuser",
			"display_name": "testUser"
		},
		"channel_id": "123456789",
		"redeemed_at": "2021-04-02T16:37:00.813078473Z",
		"reward": {
			"id": "1b09c741-3a39-43a1-8041-d15667234481",
			"channel_id": "123456789",
			"title": "Shout Out",
			"prompt": "Write a name and I give that person a shoutout",
			"cost": 1200,
			"is_user_input_required": true,
			"is_sub_only": false,
			"image": null,
			"default_image": {
				"url_1x": "https://static-cdn.jtvnw.net/custom-reward-images/default-1.png",
				"url_2x": "https://static-cdn.jtvnw.net/custom-reward-images/default-2.png",
				"url_4x": "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
			},
			"background_color": "#FAFA19",
			"is_enabled": true,
			"is_paused": false,
			"is_in_stock": true,
			"max_per_stream": {
				"is_enabled": false,
				"max_per_stream": 1
			},
			"should_redemptions_skip_request_queue": false,
		},
		"user_input": "me",
		"status": "UNFULFILLED"
	}
};

function TestRedemption() {
	const [showBody, setShowBody] = useState(false);
	const handleShowBody = () => setShowBody(prev => !prev);

	const [testData, setTestData] = useState(rawRedemptionData);

	const handleChangeUserName = (event: FormEvent<HTMLInputElement>) => {
		setTestData(val => {
			val.redemption.user.display_name = event.currentTarget.value;
			val.redemption.user.login = event.currentTarget.value.toLowerCase();
			return val;
		});
	};
	const handleChangeTitle = (event: FormEvent<HTMLInputElement>) => {
		setTestData(val => {
			val.redemption.reward.title = event.currentTarget.value;
			return val;
		});
	};
	const handleChangeCost = (event: FormEvent<HTMLInputElement>) => {
		setTestData(val => {
			val.redemption.reward.cost = Number.parseInt(event.currentTarget.value);
			return val;
		});
	};
	const handleChangeMessage = (event: FormEvent<HTMLInputElement>) => {
		setTestData(val => {
			val.redemption.user_input = event.currentTarget.value;
			return val;
		});
	};

	const handleSendMessage = () => nodecg.sendMessage('redemption', testData);

	return (
		<>
			<div className="test-section">
				<div className="test-header">
					<div className="test-header-title">
						Test Channel Points
					</div>
					<div className="test-header-buttons">
						<div onClick={handleShowBody}><DownChevronIcon/></div>
					</div>
				</div>
				{showBody && (
					<div className="test-body">
						<label htmlFor="user-name">User Name</label>
						<input id="user-name" name="user_name" value={testData.redemption.user.display_name}
							   onChange={handleChangeUserName}/>
						<label htmlFor="redemption-reward-title">Title</label>
						<input id="redemption-reward-title" name="redemption.reward.title"
							   value={testData.redemption.reward.title} onChange={handleChangeTitle}/>
						<label htmlFor="redemption-reward-cost">Cost</label>
						<input id="redemption-reward-cost" name="redemption.reward.cost" value={testData.redemption.reward.cost}
							   onChange={handleChangeCost}/>
						<label htmlFor="user-input">User Input</label>
						<input id="user-input" name="redemption.user_input" value={testData.redemption.user_input}
							   onChange={handleChangeMessage}/>
						<button className="twitch" onClick={handleSendMessage}>Send</button>
					</div>
				)}
			</div>
		</>
	)
}

function App() {
	return (
		<>
			<TestBits/>
			<TestRedemption/>
		</>
	);
}

const rootElement = document.getElementById('app');
render(<App/>, rootElement);
