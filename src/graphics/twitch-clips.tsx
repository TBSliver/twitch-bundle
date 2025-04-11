import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from "react-dom/client";
import './twitch-clips.css';
import {useReplicant} from "@nodecg/react-hooks";
import {TWITCH_SELECTED_CLIPS_REPLICANT} from "../extension/constants";
import NodeCG from "nodecg/types";

function App() {
	const [myVideo, setMyVideo] = useState<string>();
	const [videoArray, setVideoArray] = useState<string[]>([]);
	const [arrayIndex, setArrayIndex] = useState(0);
	const [availableVideos] = useReplicant<{ [id: string]: NodeCG.AssetFile }>(TWITCH_SELECTED_CLIPS_REPLICANT, {defaultValue: {}});
	const videoRef = useRef<HTMLVideoElement>(null);
	const prevUrl = useRef<string>(myVideo);



	useEffect(() => {
		let video = videoArray[arrayIndex];
		console.log("next video", video, videoArray);
		setMyVideo(video);
	}, [arrayIndex, videoArray]);

	// When availableVideos changes, regenerate the array
	useEffect(() => {
		if (availableVideos === undefined) return;
		setVideoArray(Object.values(availableVideos).map(v => v.url).sort(() => Math.random() - 0.5));
		setArrayIndex(0);
	}, [availableVideos]);

	// Load video if it isn't the current video
	useEffect(() => {
		// if (prevUrl.current === myVideo) return;
		if (videoRef.current) videoRef.current.load();
		prevUrl.current = myVideo;
	}, [myVideo]);

	// Set up the video tag ref on ended as needed
	const videoOnEnded = () => {
		setArrayIndex(p => {
			p = p + 1;
			if (p >= videoArray.length)
				return 0;
			return p;
		});
		console.log("video index", arrayIndex, videoArray.length);
	};

	if (!availableVideos) return (<></>);

	return (
		<>
			<video width={'100%'} height={'100%'} autoPlay ref={videoRef} onEnded={videoOnEnded}>
				<source src={myVideo} type={'video/mp4'}/>
				Your browser does not support the video tag.
			</video>
		</>
	);
}

const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<App/>);
