import { memo, useRef } from "react";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/components/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";

import "./styles/player.scss";

export default memo(function Player({ type, url, pipMode }) {
  const refVideo = useRef(null);

  const handleTimeUpdate = (currentTime) => {
    console.log(currentTime);
  };
  return (
    <>
      <div id="controls_player">
        {type == "live" && !pipMode ? <LiveControls /> : null}
      </div>
      {/* <HlsPlayer refVideo={refVideo} /> */}
      {url ? (
        LOCAL_STORAGE.DEVICE_OS.GET() === "android" ? (
          <AndroidPlayer url={url} timeUpdate={handleTimeUpdate} />
        ) : (
          <HlsPlayer refVideo={refVideo} url={url} />
        )
      ) : null}
    </>
  );
});
