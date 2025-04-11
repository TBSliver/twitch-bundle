import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from "react-dom/client";
import './twitch-clips.css';
import {useReplicant} from "@nodecg/react-hooks";
import {TwitchClip} from "../extension/types-common";
import {TWITCH_CLIPS_REPLICANT, TWITCH_SELECTED_CLIPS_REPLICANT} from "../extension/constants";
import NodeCG from "nodecg/types";

enum PANEL_STATE {
    PLAYLIST,
    AVAILABLE,
    DETAILS,
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
            <button onClick={() => setPanelState(PANEL_STATE.DETAILS)}
                    disabled={panelState === PANEL_STATE.DETAILS}>Details
            </button>
        </>
    }

    const showVideo = (video: NodeCG.AssetFile) => () => {
        setMyVideo(video.url);
    };

    const toggleSelect = (video: NodeCG.AssetFile) => () => {
        if (selectedClipsReplicant[video.name]) {
            delete selectedClipsReplicant[video.name];
        } else {
            selectedClipsReplicant[video.name] = video;
        }
        setSelectedClipsReplicant({...selectedClipsReplicant});
    };

    if (panelState === PANEL_STATE.PLAYLIST)
        return (
            <>
                <PanelSwitch/>
                <p>Playlist</p>
            </>
        );

    if (panelState === PANEL_STATE.AVAILABLE)
        return (
            <>
                <PanelSwitch/>
                <p>Available</p>
                <div className={"list-scroller"}>
                    {clipUploads.map(clip => (
                        <div key={clip.name}>
                            <div className={"list-text"}>
                                <div className={"list-title"}>{clip.name}</div>
                            </div>
                            <div className={"list-buttons"}>
                                <button onClick={showVideo(clip)}>Preview</button>
                                <br/>
                                <button onClick={toggleSelect(clip)}>
                                    {selectedClipsReplicant[clip.name] ? 'Unselect' : 'Selected'}
                                </button>
                            </div>
                            {clip.name}
                        </div>
                    ))}
                </div>
                <div className={"video-wrapper"}>
                    <video width={'530px'} height={'298px'} autoPlay ref={videoRef} controls>
                        <source src={myVideo} type={'video/mp4'}/>
                        Your browser does not support the video tag.
                    </video>
                </div>
            </>
        );

    if (panelState === PANEL_STATE.DETAILS)
        return (
            <>
                <PanelSwitch/>
                <p>Details</p>
            </>
        );

    return (
        <>
            <PanelSwitch/>
            <p>Uh Oh</p>
        </>
    );

    // const [myAuthor, setMyAuthor] = useState<string>();
    // const [myTitle, setMyTitle] = useState<string>();
    // const [videoReplicant] = useReplicant<TwitchClip[], TwitchClip[]>(TWITCH_CLIPS_REPLICANT, {defaultValue: []});
    // const [showSelected, setShowSelected] = useState(false);
    //
    // const showSelectedOnly = () => setShowSelected(p => !p);
    // const clipSorter = (a: TwitchClip, b: TwitchClip) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    //
    // if (!(videoReplicant && selectedClipsReplicant)) return (<><i>Loading</i></>)
    //
    // return (
    //     <>
    //         <p>Upload or delete in Assets under Clip Uploads</p>
    //
    //         <button onClick={showSelectedOnly}>{showSelected ? 'Show All' : 'Show Selected'}</button>
    //         <div className={"list-scroller"}>
    //             {showSelected
    //                 ? Object.values(selectedClipsReplicant).sort(clipSorter).map(video => (
    //                     <SelectedVideoInfo key={video.id} video={video} isSelected={false}
    //                                        showVideo={showVideo(video)} toggleSelect={toggleSelect(video)}/>
    //                 ))
    //                 : videoReplicant.map(video => (
    //                         <SelectedVideoInfo key={video.id} video={video}
    //                                            isSelected={selectedClipsReplicant[video.id] === undefined}
    //                                            showVideo={showVideo(video)} toggleSelect={toggleSelect(video)}/>
    //                     )
    //                 )}
    //         </div>
    //         <div className={"video-wrapper"}>
    //             <div className={"video-overlay"}>
    //                 <div className={"video-title"}>{myTitle}</div>
    //                 <div className={"video-creator"}>{myAuthor}</div>
    //             </div>
    //             <iframe src={`${myVideo}&parent=${nodecg.config.baseURL}`}
    //                     frameBorder="0" allowFullScreen={true} scrolling="no" height="298px" width="530px"></iframe>
    //         </div>
    //     </>
    // );
}

interface SelectedVideoInfoProps {
    video: TwitchClip;

    showVideo(): void;

    toggleSelect(): void;

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
const root = createRoot(rootElement);
root.render(<App/>);
