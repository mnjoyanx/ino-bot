import { memo } from "react";

import SvgPlay from "@assets/images/player/SvgPlay";
import SvgRewind from "@assets/images/player/SvgRewind";
import SvgForward from "@assets/images/player/SvgForward";
import SvgPause from "@assets/images/player/SvgPause";

import "../styles/ArchiveButtons.scss";

export default memo(function ArchiveButtons({ onClick, active }) {
  return (
    <div className="buttons-group-live">
      <div className={`rewind btn-group-live${active === 1 ? " active" : ""}`}>
        <SvgRewind />
      </div>
      <div
        className={`play-pause btn-group-live${active === 2 ? " active" : ""}`}
      >
        {/* <SvgPlay /> */}
        <SvgPause />
      </div>
      <div className={`forward btn-group-live${active === 3 ? " active" : ""}`}>
        <SvgForward />
      </div>
    </div>
  );
});
