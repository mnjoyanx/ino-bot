import { memo, useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatTime } from "@utils/util";
import { setPaused } from "@app/player/playerSlice";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";
import { selectPlayerType } from "@app/channels/channelsSlice";
import { useToast } from "@hooks/useToast";
import VodControls from "./components/VodControl";

import "./styles/player.scss";
import { useMovieInfo } from "../../context/movieInfoContext";

let timeout = null;

const isHlsUrl = (url) => {
  return url.includes(".m3u8") || url.includes(".ts");
};

export default memo(function Player({
  type,
  url,
  pipMode,
  setUrl,
  setPipMode,
  refUrlLive,
  endedArchive,
  retryC,
  setRetryC,
  title,
  onEnded,
  onRememberTime,
  startTime,
}) {
  const dispatch = useDispatch();
  const refVideo = useRef(null);
  const refDuration = useRef(null);
  const refCurrentTime = useRef(null);
  const refProgress = useRef(null);
  const { retryOperation, showToast, hideToast } = useToast();

  const secCurrentTime = useRef(0);
  const secDuration = useRef(0);
  const lastRememberTimeUpdate = useRef(0);
  const maxRetries = 3;

  const [retryCount, setRetryCount] = useState(0);
  const [alreadyRetryed, setAlreadyRetryed] = useState(false);

  const playerType = useSelector(selectPlayerType);

  const play = () => {
    if (!window.Android) {
      refVideo.current.play();
    } else {
      window.Android.play();
    }
    dispatch(setPaused(false));
  };

  const pause = () => {
    if (!window.Android) {
      refVideo.current.pause();
    } else {
      window.Android.pause();
    }
    dispatch(setPaused(true));
  };

  const loadedMetadataHandler = useCallback(() => {
    hideToast();
    if (startTime && refVideo.current) {
      refVideo.current.currentTime = startTime;
    }
    play();
  }, [startTime]);

  const handleTimeUpdate = (currentTime, duration) => {
    secCurrentTime.current = currentTime;
    secDuration.current = duration;

    if (Math.floor(currentTime) >= duration - 1) {
      if (type === "vod") {
        onEnded();
      } else {
        endedArchive();
      }
    } else {
      if (refDuration.current) {
        refDuration.current.innerHTML = formatTime(duration);
      }
      if (refCurrentTime.current) {
        refCurrentTime.current.innerHTML = formatTime(currentTime);
      }
      if (refProgress.current) {
        refProgress.current.style.width = `${(currentTime / duration) * 100}%`;
      }

      // Remember time logic
      if (type === "vod" && currentTime > 0) {
        const now = Date.now();
        if (now - lastRememberTimeUpdate.current >= 15000) {
          // 15 seconds
          const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
          onRememberTime(Math.floor(currentTime), percent);
          lastRememberTimeUpdate.current = now;
        }
      }
    }
  };

  const streamEnd = () => {
    if (type === "live") {
      if (playerType !== "live") {
        endedArchive();
      }
    }
  };

  const onBack = () => {
    const currentTime = Math.floor(secCurrentTime.current);
    const percent = (currentTime / secDuration.current) * 100;
    onRememberTime(currentTime, percent, true);
  };

  // const onErrorHandler = useCallback(
  //   async (error) => {
  //     try {
  //       await retryOperation(retryPlayback, {
  //         maxRetries: 3,
  //         retryDelay: 2000,
  //         onSuccess: () => {
  //           showToast("Playback resumed successfully", "success", 3000);
  //         },
  //         onError: () => "Unable to play channel. Please try again later.",
  //         errorDuration: 5000,
  //       });
  //     } catch (error) {
  //       console.error("All retry attempts failed:", error);
  //     }
  //   },
  //   [retryOperation, showToast]
  // );

  const retryPlayback = useCallback(async () => {
    if (!refVideo.current) return;

    return new Promise((resolve, reject) => {
      if (!window.Android) {
        if (refVideo.current) {
          refVideo.current.load();
          refVideo.current.play().then(resolve).catch(reject);
        }
      } else {
        try {
          window.Android.reload();
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  }, [refVideo.current]);

  const onErrorHandler = async (err) => {
    console.warn("----------errrorrr---------", err);

    if (retryC < maxRetries) {
      showToast(
        `Attempting to replay... (${retryC + 1}/${maxRetries})`,
        "retrying"
      );
    } else {
      hideToast();
      setAlreadyRetryed(true);
      showToast("Unable to play video. Please try again later.", "error", 5000);
      setRetryC(0);
      return;
    }

    setRetryC(retryC + 1);
    try {
      await retryPlayback();
      setRetryC(0);
    } catch (error) {
      console.error("All retry attempts failed:", error);
    }
  };

  // useEffect(() => {
  //   return () => {
  //     // Final remember time update when component unmounts
  //     if (type === "vod" && secCurrentTime.current > 0) {
  //       const currentTime = Math.floor(secCurrentTime.current);
  //       const duration = Math.floor(secDuration.current);
  //       const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  //       onRememberTime(currentTime, percent);
  //       console.log(
  //         `Final remember time update: ${currentTime}s, ${percent.toFixed(2)}%`
  //       );
  //     }
  //   };
  // }, [type, onRememberTime]);

  useEffect(() => {
    console.log("URL in Player:", url);
    document.addEventListener("playerError", onErrorHandler);
    setRetryC(0);
    hideToast();

    return () => {
      document.removeEventListener("playerError", onErrorHandler);
    };
  }, [url]);

  // useEffect(() => {
  //   if (type !== "vod") return;

  //   if (!refVideo.current) return;

  //   const duration = refVideo.current.duration;
  //   const currentTime = refVideo.current.currentTime;
  //   console.log("currentTime", currentTime);
  //   const percent = (currentTime / duration) * 100;

  //   const intervalId = setInterval(() => {
  //     onRememberTime(currentTime, percent);
  //   }, 5000);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [type, onRememberTime, refVideo.current]);

  const renderPlayer = () => {
    if (!url) return null;

    if (LOCAL_STORAGE.DEVICE_OS.GET() === "android") {
      return (
        <AndroidPlayer
          url={url}
          timeUpdate={handleTimeUpdate}
          streamEnd={streamEnd}
          startTime={startTime}
        />
      );
    }

    if (isHlsUrl(url)) {
      return (
        <HlsPlayer
          refVideo={refVideo}
          url={url}
          timeUpdate={handleTimeUpdate}
          streamEnd={streamEnd}
          error={onErrorHandler}
          loadVideo={loadedMetadataHandler}
          startTime={startTime}
        />
      );
    }

    // Fallback to native HTML5 video player for non-HLS URLs
    return (
      <video
        ref={refVideo}
        src={url}
        id="video_player"
        onTimeUpdate={() =>
          handleTimeUpdate(
            refVideo.current.currentTime,
            refVideo.current.duration
          )
        }
        onEnded={streamEnd}
        onLoadedMetadata={loadedMetadataHandler}
        onError={onErrorHandler}
        onWaiting={() => console.log("Video is waiting")}
        autoPlay
        playsInline
      />
    );
  };

  return (
    <>
      <div id="controls_player">
        {type === "live" && !pipMode && (
          <LiveControls
            setUrl={setUrl}
            url={url}
            refUrlLive={refUrlLive}
            durationRef={refDuration}
            currentTimeRef={refCurrentTime}
            setPipMode={setPipMode}
            refProgress={refProgress}
            secCurrentTime={secCurrentTime}
            secDuration={secDuration}
            refVideo={refVideo}
            play={play}
            pause={pause}
          />
        )}
        {type === "vod" && !pipMode && (
          <VodControls
            durationRef={refDuration}
            currentTimeRef={refCurrentTime}
            refProgress={refProgress}
            secCurrentTime={secCurrentTime}
            secDuration={secDuration}
            refVideo={refVideo}
            play={play}
            pause={pause}
            onBack={onBack}
            title={title}
          />
        )}
      </div>
      {renderPlayer()}
    </>
  );
});
