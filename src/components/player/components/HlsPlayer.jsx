import { memo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setResolutions,
  setSubtitles,
  selectSelectedQuality,
  selectSelectedSubtitle,
  selectSelectedPlaybackSpeed,
} from "../../../app/global";

export default memo(function HlsPlayer({
  refVideo,
  url,
  loadVideo,
  timeUpdate,
  waiting,
  play,
  pause,
  error,
  streamEnd,
}) {
  const dispatch = useDispatch();
  const selectedQuality = useSelector(selectSelectedQuality);
  const selectedSubtitle = useSelector(selectSelectedSubtitle);
  const selectedPlaybackSpeed = useSelector(selectSelectedPlaybackSpeed);
  const currentTime = useRef(0);
  const hlsRef = useRef(null);

  useEffect(() => {
    let hls = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(refVideo.current);

      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        const resolutions = hls.levels.map((level) => level.height);
        const uniqueResolutions = [...new Set(resolutions)];
        const res = uniqueResolutions.map((resolution) => ({
          height: resolution,
          index: hls.levels.findIndex((level) => level.height === resolution),
          group_index: 0,
        }));
        dispatch(setResolutions(res));

        refVideo.current.play().catch((e) => console.error("Play failed:", e));
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, function (e, data) {
        // dispatch(setSubtitles(hls.subtitleTracks));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, function (e, data) {
        // console.log(data, "level switched");
      });

      hls.on(Hls.Events.ERROR, function (err, data) {
        error(err);
      });
    } else {
      refVideo.current.src = url;
    }

    return () => {
      if (hls) {
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    if (hlsRef.current) {
      const hls = hlsRef.current;
      if (selectedQuality.id === "Auto") {
        hls.currentLevel = -1; // Auto quality
      } else {
        const qualityLevel = hls.levels.findIndex(
          (level) => `${level.height}p` === selectedQuality.id,
        );
        if (qualityLevel !== -1) {
          hls.currentLevel = qualityLevel;
        }
      }
    }
  }, [selectedQuality]);

  useEffect(() => {
    if (hlsRef.current) {
      const hls = hlsRef.current;
      if (selectedSubtitle.id === "Off") {
        hls.subtitleTrack = -1;
      } else {
        const subtitleTrack = hls.subtitleTracks.findIndex(
          (track) => track.id === selectedSubtitle.id,
        );
        if (subtitleTrack !== -1) {
          hls.subtitleTrack = subtitleTrack;
        }
      }
    }
  }, [selectedSubtitle]);

  useEffect(() => {
    if (refVideo.current) {
      refVideo.current.playbackRate = 1;
    }
  }, [selectedPlaybackSpeed]);

  return (
    <video
      onTimeUpdate={() => {
        if (currentTime.current !== Math.floor(refVideo.current.currentTime)) {
          currentTime.current = Math.floor(refVideo.current.currentTime);
          timeUpdate(refVideo.current.currentTime, refVideo.current.duration);
        }
      }}
      onEnded={streamEnd}
      onLoadedMetadata={loadVideo}
      onError={error}
      onWaiting={waiting}
      id="video_player"
      ref={refVideo}
      autoPlay={true}
      src={url}
      playsInline
    />
  );
});
