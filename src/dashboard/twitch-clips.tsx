import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from "react-dom/client";
import './twitch-clips.css';
import {useReplicant} from "@nodecg/react-hooks";
import {TWITCH_SELECTED_CLIPS_REPLICANT} from "../extension/constants";
import NodeCG from "nodecg/types";

enum PANEL_STATE {
    PLAYLIST,
    AVAILABLE,
}

function App() {
    const [clipUploads] = useReplicant<NodeCG.AssetFile[], NodeCG.AssetFile[]>('assets:clip-uploads', {defaultValue: []});
    const [panelState, setPanelState] = useState<PANEL_STATE>(PANEL_STATE.PLAYLIST);
    const [selectedClipsReplicant, setSelectedClipsReplicant] = useReplicant<
        { [id: string]: NodeCG.AssetFile }, { [id: string]: NodeCG.AssetFile }
    >(TWITCH_SELECTED_CLIPS_REPLICANT, {defaultValue: {}});
    const [myVideo, setMyVideo] = useState<string>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const prevUrl = useRef<string>(myVideo);
    const [showPreview, setShowPreview] = useState<boolean>(false);

    useEffect(() => {
        if (prevUrl.current === myVideo) return;
        if (videoRef.current) videoRef.current.load();
        prevUrl.current = myVideo;
    }, [myVideo]);

    const PanelSwitch = () => {
        return <>
            <button onClick={() => setPanelState(PANEL_STATE.PLAYLIST)}
                    disabled={panelState === PANEL_STATE.PLAYLIST}>Playlist
            </button>
            <button onClick={() => setPanelState(PANEL_STATE.AVAILABLE)}
                    disabled={panelState === PANEL_STATE.AVAILABLE}>Available
            </button>
            <button onClick={() => setShowPreview(v => !v)}>
                {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
        </>
    }

    const PreviewBox = () => {
        return showPreview ? (
            <div className={"video-wrapper"}>
                <video width={'530px'} height={'298px'} autoPlay ref={videoRef} controls>
                    <source src={myVideo} type={'video/mp4'}/>
                    Your browser does not support the video tag.
                </video>
            </div>
        ) : (<></>)
    }

    const showVideo = (video: NodeCG.AssetFile) => () => {
        setMyVideo(video.url);
    };

    const toggleSelect = (video: NodeCG.AssetFile) => () => {
        setSelectedClipsReplicant(val => {
            if (val[video.name]) {
                val[video.name] = undefined;
            } else {
                val[video.name] = video;
            }
        });
    };

    const clipSorter = (a: NodeCG.AssetFile, b: NodeCG.AssetFile) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);

    if (!clipUploads || !selectedClipsReplicant) return

    if (panelState === PANEL_STATE.PLAYLIST)
        return (
            <>
                <PanelSwitch/>
                <p>Playlist</p>
                <div className={"list-scroller"}>
                    {Object.values(selectedClipsReplicant).sort(clipSorter).map(clip => (
                        <SelectedVideoInfo key={clip.name} video={clip} isSelected={true}
                                           showVideo={showVideo(clip)} toggleSelect={toggleSelect(clip)}/>
                    ))}
                </div>
                <PreviewBox/>
            </>
        );

    if (panelState === PANEL_STATE.AVAILABLE)
        return (
            <>
                <PanelSwitch/>
                <p>Available</p>
                <div className={"list-scroller"}>
                    {clipUploads.map(clip => (
                        <SelectedVideoInfo key={clip.name} video={clip}
                                           isSelected={selectedClipsReplicant[clip.name] !== undefined}
                                           showVideo={showVideo(clip)} toggleSelect={toggleSelect(clip)}/>
                    ))}
                </div>
                <PreviewBox/>
            </>
        );

    return (
        <>
            <PanelSwitch/>
            <p>Uh Oh</p>
        </>
    );
}

interface SelectedVideoInfoProps {
    video: NodeCG.AssetFile;
    isSelected: boolean;
    showVideo: React.MouseEventHandler<HTMLButtonElement>;
    toggleSelect: React.MouseEventHandler<HTMLButtonElement>;
}

function SelectedVideoInfo({video, showVideo, toggleSelect, isSelected}: SelectedVideoInfoProps) {
    return (
        <div key={video.name} className={"list-item"}>
            <div className={"list-text"}>
                <div className={"list-title"}>{video.name}</div>
            </div>
            <div className={"list-buttons"}>
                <button onClick={showVideo}>Preview</button>
                <br/>
                <button onClick={toggleSelect}>
                    {isSelected ? 'Unselect' : 'Select'}
                </button>
            </div>
        </div>
    )
}

const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(<App/>);
