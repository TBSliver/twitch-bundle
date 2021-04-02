/// <reference path="../../../../types/browser.d.ts" />
import React, {FormEvent, useEffect, useState} from 'react';
import {render} from 'react-dom';
import {useReplicant} from 'use-nodecg';
import './twitch-auth.css';
import {TwitchCredentials} from "../extension/types";

export function App() {
	const [callbackUrl, setCallbackUrl] = useState('#');
	const [authorizeUrl, setAuthorizeUrl] = useState('#');

	// Initialise just these two to stop react inputs complaining
	const [twitchCredentials, setTwitchCredentials] = useReplicant<TwitchCredentials | any>('twitchCredentials', {
		clientId: '',
		clientSecret: '',
	});

	useEffect(() => {
		console.log('getting urls');
		nodecg.sendMessage('getAuthorizeUrl', (err, url: string) => setAuthorizeUrl(url));
		nodecg.sendMessage('getCallbackUrl', (err, url: string) => setCallbackUrl(url));
	}, [nodecg]);

	const handleChange = (event: FormEvent<HTMLInputElement>) => {
		setTwitchCredentials({...twitchCredentials, [event.currentTarget.name]: event.currentTarget.value});
	}

	const handleLogout = () => nodecg.sendMessage('logoutTwitch');
	const handleSignIn = () => window.open(authorizeUrl, "_blank", "scrollbar=yes,resizable=yes");

	const isSignInDisabled = !(twitchCredentials.clientId.length > 0 && twitchCredentials.clientSecret.length > 0);

	if (twitchCredentials.isConnected)
		return <>
			<span>Connected as {twitchCredentials.connectedAs.name}</span>
			<button className="twitch" onClick={handleLogout}>Logout</button>
		</>;

	return (
		<>
			<a className="twitch" href="https://dev.twitch.tv/console/apps" target="_blank">Twitch Dev Console</a>
			<label htmlFor="callback-url">Callback URL</label>
			<textarea id="callback-url" value={callbackUrl} readOnly/>
			<label htmlFor="client-id">Client ID</label>
			<input id="client-id" onChange={handleChange} value={twitchCredentials.clientId} name="clientId"/>
			<label htmlFor="client-secret">Client Secret</label>
			<input id="client-secret" onChange={handleChange} value={twitchCredentials.clientSecret} name="clientSecret" type="password"/>
			<button className="twitch" onClick={handleSignIn} disabled={isSignInDisabled}>Sign In</button>
		</>
	);
}

const rootElement = document.getElementById('app');
render(<App />, rootElement);
