import React, {useState} from 'react';
import {createRoot} from "react-dom/client";
import {useReplicant} from '@nodecg/react-hooks';
import './twitch-events.css';
import {DownChevronIcon, RefreshIcon} from "./components/icon";
import dayjs from "dayjs";
import {TwitchEvent, TwitchRedemptionEvent, TwitchBitsEvent, UnionTwitchEvent} from "../extension/types-common";

const isRedemptionEvent = (event: TwitchEvent): event is TwitchRedemptionEvent => (event as TwitchRedemptionEvent).data.timestamp !== undefined;
const isBitsEvent = (event: TwitchEvent): event is TwitchBitsEvent => (event as TwitchBitsEvent).data.bits_used !== undefined;

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
    if (event.data) {
        if (isRedemptionEvent(event)) displayTime = dayjs(event.data.timestamp);
        if (isBitsEvent(event)) displayTime = dayjs(event.data.time);
    }

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
    event: UnionTwitchEvent;
}

function PubSubEvent({event}: PubSubEventProps) {
    switch (event.messageName) {
        case 'redemption':
            return (<PubSubRedemptionEvent event={event as TwitchRedemptionEvent}/>);
        case 'bits':
            return (<PubSubBitEvent event={event as TwitchBitsEvent}/>);
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
            return (<PubSubEvent event={event as UnionTwitchEvent}/>);
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
    // TODO shouldnt need to declare this twice? Jsonify in react-hooks screws with it
    const [twitchEvents] = useReplicant<TwitchEvent[], TwitchEvent[]>('twitchEvents', {defaultValue: []});
    const [max, setMax] = useState(10);

    const handleClear = () => nodecg.sendMessage('clearTwitchEvents');
    const handleShowMore = () => setMax(val => val + 10);
    const handleShowLess = () => setMax(val => val > 11 ? val - 10 : val);

    return (
        <>
            {twitchEvents && twitchEvents.slice(0, max).map((event, i) => (
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
const root = createRoot(rootElement);
root.render(<App/>);
