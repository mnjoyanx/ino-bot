import { memo, useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatTime } from "@utils/util";
import { setPaused } from "@app/player/playerSlice";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";
import { selectPlayerType, setPlayerType } from "@app/channels/channelsSlice";
import "./styles/player.scss";
import { useToast } from "../../hooks/useToast";

let timeout = null;

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
}) {
  const dispatch = useDispatch();
  const refVideo = useRef(null);
  const refDuration = useRef(null);
  const refCurrentTime = useRef(null);
  const refProgress = useRef(null);
  const { retryOperation, showToast, hideToast } = useToast();

  const secCurrentTime = useRef(0);
  const secDuration = useRef(0);
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

  const loadedMetadataHandler = () => {
    hideToast();
  };

  const handleTimeUpdate = (currentTime, duration) => {
    secCurrentTime.current = currentTime;
    secDuration.current = duration;

    if (Math.floor(currentTime) >= duration - 1) {
      endedArchive();
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
    }
  };
  const streamEnd = () => {
    if (type === "live") {
      if (playerType !== "live") {
        endedArchive();
      }
    }
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
    // if (alreadyRetryed) return;
    console.warn("----------errrorrr---------");

    if (retryC < maxRetries) {
      showToast(
        `Attempting to replay... (${retryC + 1}/${maxRetries})`,
        "retrying"
      );
    } else {
      hideToast();
      setAlreadyRetryed(true);
      showToast(
        "Unable to play channel. Please try again later.",
        "error",
        5000
      );
      // clearTimeout(timeout);
      setRetryC(0);
      return;
    }

    // timeout = setTimeout(() => {
    setRetryC(retryC + 1);
    // }, 3000);
    try {
      await retryPlayback();
      setRetryC(0);
    } catch (error) {
      console.error("All retry attempts failed:", error);
    }
  };

  useEffect(() => {
    document.addEventListener("playerError", onErrorHandler);
    setRetryC(0);
    hideToast();

    return () => {
      document.removeEventListener("playerError", onErrorHandler);
    };
  }, [url]);

  return (
    <>
      <div id="controls_player">
        {type == "live" && !pipMode ? (
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
        ) : null}
      </div>
      {/* <HlsPlayer refVideo={refVideo} /> */}
      {url ? (
        LOCAL_STORAGE.DEVICE_OS.GET() === "android" ? (
          <AndroidPlayer
            url={url}
            timeUpdate={handleTimeUpdate}
            streamEnd={streamEnd}
          />
        ) : (
          <HlsPlayer
            refVideo={refVideo}
            url={url}
            timeUpdate={handleTimeUpdate}
            streamEnd={streamEnd}
            error={onErrorHandler}
            loadVideo={loadedMetadataHandler}
          />
        )
      ) : null}
    </>
  );
});
