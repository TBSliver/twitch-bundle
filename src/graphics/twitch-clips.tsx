import React, {useEffect, useRef, useState} from 'react';
import {render} from 'react-dom';
import './twitch-clips.css';
import {useReplicant} from "use-nodecg";
import {TwitchClip} from "../extension/types";

function App() {
	const [myVideo, setMyVideo] = useState<string>();
	// const [myAuthor, setMyAuthor] = useState<string>();
	// const [myTitle, setMyTitle] = useState<string>();
	const [videoArray, setVideoArray] = useState<string[]>([]);
	const [arrayIndex, setArrayIndex] = useState(0);
	const [availableVideos] = useReplicant<{ [id: string]: TwitchClip }>('twitchSelectedClips', {});
	const videoRef = useRef<HTMLVideoElement>();
	const prevUrl = useRef<string>(myVideo);

	useEffect(() => {
		let video = videoArray[arrayIndex];
		console.log("next video", video, videoArray);
		setMyVideo(video);
	}, [arrayIndex, videoArray]);

	// When availableVideos changes, regenerate the array
	useEffect(() => {
		setVideoArray(Object.values(availableVideos).map(v => v.url).sort(() => Math.random() - 0.5));
		setArrayIndex(0);
	}, [availableVideos]);

	// Load video if it isn't the current video
	useEffect(() => {
		// if (prevUrl.current === myVideo) return;
		if (videoRef.current) videoRef.current.load();
		prevUrl.current = myVideo;
	}, [myVideo]);

	// Setup the video tag ref on ended as needed
	const videoOnEnded = () => {
		setArrayIndex(p => {
			p = p + 1;
			if (p >= videoArray.length)
				return 0;
			return p;
		});
		console.log("video index", arrayIndex, videoArray.length);
	};

	// // Trigger everything if nothings being shown
	// useEffect(() => {
	// 	if (prevUrl.current === undefined)
	// 	showNextVideo();
	// }, [videoArray]);

	return (
		<>
			<video width={'100%'} height={'100%'} autoPlay ref={videoRef} onEnded={videoOnEnded}>
				<source src={myVideo} type={'video/mp4'}/>
				Your browser does not support the video tag.
			</video>
			{/*<div className={"titles"}>*/}
			{/*	<div className={"title"}>{myTitle}</div>*/}
			{/*	<div className={"author"}>{myAuthor}</div>*/}
			{/*</div>*/}
		</>
	);
}

const rootElement = document.getElementById('app');
render(<App/>, rootElement);
