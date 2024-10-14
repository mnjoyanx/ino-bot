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
    console.log("URL changed:", url);
    let hls = null;

    if (Hls.isSupported()) {
      console.log("Hls is supported");
      hls = new Hls();

      hls.loadSource(url);
      hls.attachMedia(refVideo.current);

      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        console.log("Manifest parsed, attempting to play");
        refVideo.current.play().catch((e) => console.error("Play failed:", e));
      });

      hls.on(Hls.Events.ERROR, function (err, data) {
        console.error("Hls error:", err, data);
        error(err);
      });
    } else {
      console.warn("Hls is not supported");
      // Fallback to native video player
      refVideo.current.src = url;
    }

    return () => {
      if (hls) {
        console.log("Cleaning up Hls");
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
      }
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
      playsInline
    />
  );
});
