import { memo, useRef } from "react";
import { formatTime } from "@utils/util";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";

import "./styles/player.scss";

export default memo(function Player({
  type,
  url,
  pipMode,
  setUrl,
  setPipMode,
}) {
  const refVideo = useRef(null);
  const refDuration = useRef(null);
  const refCurrentTime = useRef(null);
  const refProgress = useRef(null);

  const handleTimeUpdate = (currentTime, duration) => {
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
  return (
    <>
      <div id="controls_player">
        {type == "live" && !pipMode ? (
          <LiveControls
            setUrl={setUrl}
            durationRef={refDuration}
            currentTimeRef={refCurrentTime}
            setPipMode={setPipMode}
            refProgress={refProgress}
          />
        ) : null}
      </div>
      {/* <HlsPlayer refVideo={refVideo} /> */}
      {url ? (
        LOCAL_STORAGE.DEVICE_OS.GET() === "android" ? (
          <AndroidPlayer url={url} timeUpdate={handleTimeUpdate} />
        ) : (
          <HlsPlayer
            refVideo={refVideo}
            url={url}
            timeUpdate={handleTimeUpdate}
          />
        )
      ) : null}
    </>
  );
});
