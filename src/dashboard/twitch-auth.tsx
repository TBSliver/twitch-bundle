import React, {Fragment, useEffect, useState} from 'react';
import {createRoot} from "react-dom/client";
import {useReplicant} from '@nodecg/react-hooks';
import './twitch-auth.css';
import {TwitchCredentials} from "../extension/types-common";

export function App() {
    const [callbackUrl, setCallbackUrl] = useState('#');
    const [authorizeUrl, setAuthorizeUrl] = useState('#');

    // Initialise just these two to stop react inputs complaining
    const [twitchCredentials] = useReplicant<TwitchCredentials, TwitchCredentials>('twitchCredentials', {defaultValue: {}});

    useEffect(() => {
        console.log('getting urls');
        nodecg.sendMessage('getAuthorizeUrl', (_err, url: string) => setAuthorizeUrl(url));
        nodecg.sendMessage('getCallbackUrl', (_err, url: string) => setCallbackUrl(url));
    }, [nodecg]);

    // currently does nothing...
    const handleLogout = () => nodecg.sendMessage('logoutTwitch');
    const handleSignIn = () => window.open(authorizeUrl, "_blank", "scrollbar=yes,resizable=yes");

    return (
        <>
            <a className="twitch" href="https://dev.twitch.tv/console/apps" target="_blank">Twitch Dev Console</a>
            <label htmlFor="callback-url">Callback URL</label>
            <textarea id="callback-url" value={callbackUrl} readOnly/>
            <button className="twitch" onClick={handleSignIn}>Sign In</button>
            {Object.entries(twitchCredentials).map(([id, cred]) => (
				<Fragment key={id}>
                    <label htmlFor="callback-url">{cred.name}</label>
                    <button className="twitch" onClick={handleLogout}>Logout</button>
                </Fragment>
            ))}
        </>
    );
}

const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<App/>);
