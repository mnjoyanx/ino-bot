import { memo } from "react";
import { useSelector } from "react-redux";
import { selectIsPaused } from "@app/player/playerSlice";
import SvgPlay from "@assets/images/player/SvgPlay";
import SvgRewind from "@assets/images/player/SvgRewind";
import SvgForward from "@assets/images/player/SvgForward";
import SvgPause from "@assets/images/player/SvgPause";

import "../styles/ArchiveButtons.scss";

export default memo(function ArchiveButtons({ play, pause, active }) {
  const isPaused = useSelector(selectIsPaused);

  const handleClick = (e) => {
    if (isPaused) play();
    else pause();
  };

  return (
    <div className="buttons-group-live">
      <div className={`rewind btn-group-live${active === 1 ? " active" : ""}`}>
        <SvgRewind />
      </div>
      <div
        className={`play-pause btn-group-live${active === 2 ? " active" : ""}`}
        onClick={handleClick}
      >
        {isPaused ? <SvgPlay /> : <SvgPause />}
      </div>
      <div className={`forward btn-group-live${active === 3 ? " active" : ""}`}>
        <SvgForward />
      </div>
    </div>
  );
});
