import { memo, useEffect, useRef, useState } from "react";

export default memo(function HlsPlayer({
  refVideo,
  url = "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  loadVideo = () => {},
  timeUpdate = () => {},
  waiting = () => {},
  play = () => {},
  pause = () => {},
  error = () => {},
  streamEnd = () => {},
}) {
  const currentTime = useRef(0);

  useEffect(() => {
    let hls = null;

    if (Hls.isSupported()) {
      hls = new Hls();

      hls.loadSource(url);
      hls.attachMedia(refVideo.current);

      hls.on(Hls.Events.AUDIO_TRACK_LOADED, function (err, data) {});

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, function (e, data) {
        // setActiveAudioTrack(hls_player.audioTrack);
        // setActiveSub(hls_player.subtitleTrack);
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_LOADED, function (e, data) {
        // console.log(hls.subtitleTracks, "sub data ----");
        // setSubtitles(hls_player.subtitleTracks);
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, function (e, data) {
        // setActiveSub(hls_player.subtitleTrack);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        // const levels = hls_player.levels;
      });

      refVideo.current.onwaiting = () => {
        waiting();
      };

      // refVideo.current.onplay = () => {
      //   play();
      // };

      refVideo.current.onpause = () => {
        pause();
      };

      // if(activeMedia){
      hls.on(Hls.Events.ERROR, function (err, data) {
        if (data.type == "mediaError") {
        } else {
        }
      });
    }

    return () => {
      hls.stopLoad();
      hls.detachMedia();
      hls.destroy();
    };
  }, [url]);

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
    />
  );
});
