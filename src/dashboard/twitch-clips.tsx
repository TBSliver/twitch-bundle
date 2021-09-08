import React, {useEffect, useRef, useState} from 'react';
import {render} from 'react-dom';
import './twitch-clips.css';
import {useReplicant} from "use-nodecg";
import {TwitchClip} from "../extension/types";

function App() {
	const [myVideo, setMyVideo] = useState<string>();
	const [myAuthor, setMyAuthor] = useState<string>();
	const [myTitle, setMyTitle] = useState<string>();
	const [videoReplicant] = useReplicant<TwitchClip[]>('twitchClips', []);
	const [selectedClipsReplicant, setSelectedClipsReplicant] = useReplicant<{ [id: string]: TwitchClip }>('twitchSelectedClips', {});
	const [showSelected, setShowSelected] = useState(false);
	const videoRef = useRef<HTMLVideoElement>();
	const prevUrl = useRef<string>(myVideo);

	const showVideo = (video: TwitchClip) => () => {
		setMyVideo(video.url);
		setMyAuthor(video.creator_name);
		setMyTitle(video.title);
	};

	const refreshVideos = () => {
		nodecg.sendMessage('updateTwitchClips');
	};

	useEffect(() => {
		if (prevUrl.current === myVideo) return;
		if (videoRef.current) videoRef.current.load();
		prevUrl.current = myVideo;
	}, [myVideo]);

	const toggleSelect = (video: TwitchClip) => () => {
		if (selectedClipsReplicant[video.id]) {
			delete selectedClipsReplicant[video.id];
		} else {
			selectedClipsReplicant[video.id] = video;
		}
		setSelectedClipsReplicant({...selectedClipsReplicant});
	};

	const showSelectedOnly = () => setShowSelected(p => !p);
	const clipSorter = (a: TwitchClip, b: TwitchClip) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

	return (
		<>
			<button onClick={refreshVideos}>Refresh Clips</button>
			<button onClick={showSelectedOnly}>{showSelected ? 'Show All' : 'Show Selected'}</button>
			<div className={"list-scroller"}>
				{showSelected
					? Object.values(selectedClipsReplicant).sort(clipSorter).map(video => (
						<SelectedVideoInfo key={video.id} video={video} isSelected={false}
										   showVideo={showVideo(video)} toggleSelect={toggleSelect(video)}/>
					))
					: videoReplicant.map(video => (
							<SelectedVideoInfo key={video.id} video={video}
											   isSelected={selectedClipsReplicant[video.id] === undefined}
											   showVideo={showVideo(video)} toggleSelect={toggleSelect(video)}/>
						)
					)}
			</div>
			<div className={"video-wrapper"}>
				<div className={"video-overlay"}>
					<div className={"video-title"}>{myTitle}</div>
					<div className={"video-creator"}>{myAuthor}</div>
				</div>
				<video width={'530px'} height={'298px'} autoPlay ref={videoRef} controls>
					<source src={myVideo} type={'video/mp4'}/>
					Your browser does not support the video tag.
				</video>
			</div>
		</>
	)
		;
}

interface SelectedVideoInfoProps {
	video: TwitchClip;

	showVideo()
		:
		void;

	toggleSelect()
		:
		void;

	isSelected: boolean;
}

function SelectedVideoInfo(
	{
		video, showVideo, toggleSelect, isSelected
	}
		: SelectedVideoInfoProps) {
	return (
		<div key={video.id} className={"list-item"}>
			<div className={"list-text"}>
				<div className={"list-title"}>{video.creator_name} - {video.title}</div>
				<div className={"list-time"}>{video.created_at}</div>
			</div>
			<div className={"list-buttons"}>
				<button onClick={showVideo}>Preview</button>
				<br/>
				<button onClick={toggleSelect}>
					{isSelected ? 'Select' : 'Unselect'}
				</button>
			</div>
		</div>
	)
}

const rootElement = document.getElementById('app');
render(<App/>, rootElement);
