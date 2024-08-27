import { memo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatTime } from "@utils/util";
import { setPaused } from "@app/player/playerSlice";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";
import {
  selectPlayerType,
  setPlayerType,
} from "@app/channels/channelsSlice";
import "./styles/player.scss";

export default memo(function Player({
  type,
  url,
  pipMode,
  setUrl,
  setPipMode,
  refUrlLive,
  endedArchive,
}) {
  const dispatch = useDispatch();
  const refVideo = useRef(null);
  const refDuration = useRef(null);
  const refCurrentTime = useRef(null);
  const refProgress = useRef(null);

  const secCurrentTime = useRef(0);
  const secDuration = useRef(0);

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

  const handleTimeUpdate = (currentTime, duration) => {
    secCurrentTime.current = currentTime;
    secDuration.current = duration;
    if (refDuration.current) {
      refDuration.current.innerHTML = formatTime(duration);
    }
    if (refCurrentTime.current) {
      refCurrentTime.current.innerHTML = formatTime(currentTime);
    }
    if (refProgress.current) {
      refProgress.current.style.width = `${(currentTime / duration) * 100}%`;
    }
  };
  const streamEnd = () => {
    if (type === "live") {
      if (playerType !== "live") {
        endedArchive();
      }
    }
  };
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
          />
        )
      ) : null}
    </>
  );
});
