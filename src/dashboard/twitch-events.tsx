/// <reference path="../../../../types/browser.d.ts" />
import React, {useState} from 'react';
import {render} from 'react-dom';
import {useReplicant} from 'use-nodecg';
import './twitch-events.css';
import {
	TwitchBitsBadgeEvent,
	TwitchBitsEvent,
	TwitchEvent,
	TwitchPubSubEvent,
	TwitchRedemptionEvent,
	TwitchSubscriptionEvent
} from "../extension/types";
import {DownChevronIcon, RefreshIcon} from "./components/icon";
import dayjs from "dayjs";

const isRedemptionEvent = (event: TwitchEvent): event is TwitchRedemptionEvent => (event as TwitchRedemptionEvent).data.timestamp !== undefined;
const isSubscriptionEvent = (event: TwitchEvent): event is TwitchSubscriptionEvent => (event as TwitchSubscriptionEvent).data.sub_message !== undefined;
const isBitsEvent = (event: TwitchEvent): event is TwitchBitsEvent => (event as TwitchBitsEvent).data.bits_used !== undefined;
const isBitsBadgeEvent = (event: TwitchEvent): event is TwitchBitsBadgeEvent => (event as TwitchBitsBadgeEvent).data.badge_tier !== undefined;

interface EventSectionProps {
	title: React.ReactNode;
	children?: React.ReactNode;
	event: TwitchEvent;
}

function EventSection({title, children, event}: EventSectionProps) {
	const [showChildren, setShowChildren] = useState(false);
	const handleShowChildren = () => setShowChildren(prev => !prev);
	const handleResendEvent = () => nodecg.sendMessage(event.messageName, event.data);

	let displayTime;
	if (isRedemptionEvent(event)) displayTime = dayjs(event.data.timestamp);
	if (isSubscriptionEvent(event) || isBitsEvent(event) || isBitsBadgeEvent(event)) displayTime = dayjs(event.data.time);

	return (
		<div className="event-section">
			<div className="event-header">
				<div className="event-header-title">
					<div className="time">{displayTime?.format('HH:mm:ss') || <i>No Time</i>}</div>
					{title}
				</div>
				<div className="event-header-buttons">
					<div onClick={handleResendEvent}><RefreshIcon/></div>
					<div onClick={handleShowChildren}><DownChevronIcon/></div>
				</div>
			</div>
			{showChildren && (
				<div className="event-children">{children}</div>
			)}
		</div>
	);
}

interface DataSectionProps {
	name: string;
	value: React.ReactNode;
}

function DataSection({name, value}: DataSectionProps) {
	return <p>
		<span className="data-section-name">{name}</span>: <span className="data-section-value">{value}</span>
	</p>
}

interface PubSubSubscriptionEventProps {
	event: TwitchSubscriptionEvent;
}

function PubSubSubscriptionEvent({event}: PubSubSubscriptionEventProps) {
	const isGift = event.data.context === 'subgift' || event.data.context === 'anonsubgift';
	return (
		<EventSection
			title={<>
				<div className="subscription">Sub {isGift && 'Gift'}</div>
				<div className="user">{event.data.display_name}</div>
				{event.data.sub_plan_name}</>}
			event={event}>
			<DataSection name="User" value={event.data.display_name}/>
			<DataSection name="Level" value={event.data.sub_plan_name}/>
			<DataSection name="Timestamp" value={dayjs(event.data.time).format('ddd, MMM D, YYYY h:mm A')}/>
			{event.data.context === 'sub' || event.data.context === 'resub' && (
				<>
					<DataSection name="Cumulative" value={event.data.cumulative_months}/>
					<DataSection name="Streak" value={event.data.streak_months}/>
				</>
			)}
			{event.data.context === 'subgift' || event.data.context === 'anonsubgift' && (
				<>
					<DataSection name="No. Months" value={event.data.months}/>
				</>
			)}
			<DataSection name="Message" value={event.data.sub_message.message || <i>No Message</i>}/>
		</EventSection>
	);
}

interface PubSubBitBadgeEventProps {
	event: TwitchBitsBadgeEvent;
}

function PubSubBitBadgeEvent({event}: PubSubBitBadgeEventProps) {
	return (
		<EventSection
			title={<>
				<div className="bits-badge">Bits Badge</div>
				<div className="user">{event.data.user_name}</div>
				{event.data.badge_tier}</>}
			event={event}>
			<DataSection name="User" value={event.data.user_name}/>
			<DataSection name="Badge Tier" value={event.data.badge_tier}/>
			<DataSection name="Timestamp" value={dayjs(event.data.time).format('ddd, MMM D, YYYY h:mm A')}/>
			<DataSection name="Message" value={event.data.chat_message || <i>No Message</i>}/>
		</EventSection>
	);
}

interface PubSubBitEventProps {
	event: TwitchBitsEvent;
}

function PubSubBitEvent({event}: PubSubBitEventProps) {
	return (
		<EventSection
			title={<>
				<div className="bits">Bits</div>
				{event.data.is_anonymous
					? <div className="user"><i>Anonymous</i></div>
					: <div className="user">{event.data.user_name}</div>}
				{event.data.bits_used}</>}
			event={event}>
			<DataSection name="User" value={event.data.is_anonymous
				? <i>Anonymous</i>
				: event.data.user_name}/>
			<DataSection name="Bits" value={event.data.bits_used}/>
			<DataSection name="Timestamp" value={dayjs(event.data.time).format('ddd, MMM D, YYYY h:mm A')}/>
			<DataSection name="Message" value={event.data.chat_message || <i>No Message</i>}/>
		</EventSection>
	);
}

interface PubSubRedemptionEventProps {
	event: TwitchRedemptionEvent;
}

function PubSubRedemptionEvent({event}: PubSubRedemptionEventProps) {
	return (
		<EventSection
			title={<>
				<div className="redemption">Points</div>
				<div className="user">{event.data.redemption.user.display_name}</div>
				{event.data.redemption.reward.title}</>}
			event={event}>
			<DataSection name="User" value={event.data.redemption.user.display_name}/>
			<DataSection name="Reward" value={event.data.redemption.reward.title}/>
			<DataSection name="Timestamp" value={dayjs(event.data.timestamp).format('ddd, MMM D, YYYY h:mm A')}/>
			<DataSection name="Message" value={event.data.redemption.user_input || <i>No Message</i>}/>
		</EventSection>
	);
}

interface PubSubEventProps {
	event: TwitchPubSubEvent;
}

function PubSubEvent({event}: PubSubEventProps) {
	switch (event.messageName) {
		case 'redemption':
			return (<PubSubRedemptionEvent event={event as TwitchRedemptionEvent}/>);
		case 'bits':
			return (<PubSubBitEvent event={event as TwitchBitsEvent}/>);
		case 'bitsBadgeUnlock':
			return (<PubSubBitBadgeEvent event={event as TwitchBitsBadgeEvent}/>);
		case 'subscription':
			return (<PubSubSubscriptionEvent event={event as TwitchSubscriptionEvent}/>);
		default:
			return (
				<EventSection title={<>
					<div className="pub-sub">PubSub</div>
					{event.messageName}</>} event={event}>
					<pre>{JSON.stringify(event.data, null, 2)}</pre>
				</EventSection>
			);
	}
}

interface TwitchEventProps {
	event: TwitchEvent;
}

function TwitchEvent({event}: TwitchEventProps) {
	switch (event.type) {
		case 'PubSub':
			return (<PubSubEvent event={event as TwitchPubSubEvent}/>);
		default:
			return (
				<EventSection title={<>
					<div className="unknown">{event.type || 'unknown'}</div>
					{event.messageName}
				</>} event={event}>
					<pre>{JSON.stringify(event.data, null, 2)}</pre>
				</EventSection>
			);
	}
}

export function App() {
	const [twitchEvents] = useReplicant<TwitchEvent[]>('twitchEvents', []);
	const [max, setMax] = useState(10);

	const handleClear = () => nodecg.sendMessage('clearTwitchEvents');
	const handleShowMore = () => setMax(val => val + 10);
	const handleShowLess = () => setMax(val => val > 11 ? val - 10 : val);

	return (
		<>
			{twitchEvents.slice(0, max).map((event, i) => (
				<TwitchEvent event={event} key={i}/>
			))}
			<div className="action-buttons">
				<div className="button">
					<button className="clear" onClick={handleClear}>Clear</button>
				</div>
				<span>Showing first {max} of {twitchEvents.length}</span>
				<div className="button">
					<button className="less" onClick={handleShowLess}>Less</button>
					<button className="more" onClick={handleShowMore}>More</button>
				</div>
			</div>
		</>
	);
}

const rootElement = document.getElementById('app');
render(<App/>, rootElement);
