/// <reference path="../../../../../types/browser.d.ts" />
import * as React from 'react';
import {FormEvent, useEffect, useState} from 'react';
import {useReplicant} from 'use-nodecg';
import {TwitchCredentials} from "../../extension/types";

export function App() {
	// const callbackUrl = 'wtf';
	// const authorizeUrl = 'wtf';
	const [callbackUrl, setCallbackUrl] = useState('#');
	const [authorizeUrl, setAuthorizeUrl] = useState('#');
	const [twitchCredentials, setTwitchCredentials] = useReplicant<TwitchCredentials | any>('twitchCredentials', {
		clientId: '',
		clientSecret: '',
	});

	useEffect(() => {
		console.log('getting urls');
		console.log(nodecg);
		nodecg.sendMessage('getAuthorizeUrl', (err, url: string) => setAuthorizeUrl(url));
		nodecg.sendMessage('getCallbackUrl', (err, url: string) => setCallbackUrl(url));
	}, [nodecg])

	const handleChange = (event: FormEvent<HTMLInputElement>) => {
		setTwitchCredentials({...twitchCredentials, [event.currentTarget.name]: event.currentTarget.value});
	}

	const handleLogout = () => nodecg.sendMessage('logoutTwitch');
	const handleSignIn = () => window.open(authorizeUrl, "_blank", "toolbar=yes,scrollbar=yes,resizable=yes");

	if (twitchCredentials.isConnected)
		return <>
			<p>Connected as {twitchCredentials.connectedAs.name}</p>
			<button onClick={handleLogout}>Logout</button>
	 	</>;

	return (
		<>
			<a href="https://dev.twitch.tv/console/apps" target="_blank">Twitch Dev Console</a>
			<p>Set up a new App using the following Callback URL</p>
			<textarea value={callbackUrl} readOnly/>
			<p>Put the Client ID and secret below</p>
			<label htmlFor="client-id">Client ID</label><br/>
			<input id="client-id" onChange={handleChange} value={twitchCredentials.clientId} name="clientId"/><br/>
			<label htmlFor="client-secret">Client Secret</label><br/>
			<input id="client-secret" onChange={handleChange} value={twitchCredentials.clientSecret} name="clientSecret" type="password"/><br/>
			<button onClick={handleSignIn}>Sign In</button>
		</>
	);
}

// import * as React from 'react';
// import {useState} from 'react';
//
// export function App() {
// 	// const url = '#';
// 	const [url, setUrl] = useState('#');
//
// 	return (<p>{url}</p>);
// }
