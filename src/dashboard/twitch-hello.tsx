import {render} from "react-dom";
import React, {ChangeEvent, useState} from "react";
import {useReplicant} from "use-nodecg";
import './twitch-hello.css';

interface TwitchHello {
	username: string;
	firstMessageTimestamp: number;
}

export function App() {
	const [twitchHello, setTwitchHello] = useReplicant<Array<TwitchHello>>('twitchHello', []);
	const [lastClear, setLastClear] = useReplicant<number>('twitchHelloClear', 0);
	const [twitchHelloIgnore, setTwitchHelloIgnore] = useReplicant<Array<string>>('twitchHelloIgnore', []);
	const [showIgnoreList, setShowIgnoreList] = useState(false);
	const [newIgnore, setNewIgnore] = useState("");

	const handleClear = () => {
		setLastClear(new Date().getTime());
	}

	const handleReset = () => {
		setTwitchHello([]);
	}

	const helloFilter = (hello: TwitchHello) => {
		return hello.firstMessageTimestamp > lastClear;
	}

	const dateFormat = (date: number) => {
		const d = new Date(date);
		return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
	}

	const timeFormat = (date: number) => {
		const d = new Date(date);
		return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
	}

	const handleToggleIgnore = () => {
		setShowIgnoreList(val => !val);
	}

	const handleRemoveIgnore = (name: string) => () => {
		setTwitchHelloIgnore(twitchHelloIgnore.filter(v => v !== name))
	}

	const handleAddIgnore = () => {
		setTwitchHelloIgnore([...twitchHelloIgnore, newIgnore]);
	}

	const handleAddIgnoreChange = (e: ChangeEvent<HTMLInputElement>) => {
		setNewIgnore(e.target.value);
	}

	return (
		<>
			{twitchHello.filter(helloFilter).map(hello => (
				<p key={hello.username}>{timeFormat(hello.firstMessageTimestamp)} | {hello.username}</p>
			))}
			<div className="action-buttons">
				<div className="button">
					<button className="reset" onClick={handleReset}>Reset</button>
				</div>
				<div className="button">
					<button className="ignore" onClick={handleToggleIgnore}>Ignore</button>
				</div>
				<div className="button">
					<button className="clear" onClick={handleClear}>Clear</button>
				</div>
			</div>
			<pre>Last Clear: {dateFormat(lastClear)} {timeFormat(lastClear)}</pre>
			{showIgnoreList && (
				<div className={"ignore-list"}>
					<div className={"ignore-item"}>
						<input className={"ignore-name"} value={newIgnore} onChange={handleAddIgnoreChange}/>
						<button className={"ignore-button"} onClick={handleAddIgnore}>+</button>
					</div>
					{twitchHelloIgnore.map(name => (
						<div className={"ignore-item"} key={name}>
							<div className="ignore-name">{name}</div>
							<button className={"ignore-button"} onClick={handleRemoveIgnore(name)}>X</button>
						</div>
					))}
				</div>
			)}
		</>
	);
}

const rootElement = document.getElementById('app');
render(<App/>, rootElement);
