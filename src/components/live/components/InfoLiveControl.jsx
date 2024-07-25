import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import SvgArrow from "@assets/images/live/SvgArrow";

export default memo(function InfoLiveControl({ currentChannel }) {
  return (
    <>
      <div className="parent-number-channel">
        <span className="arrow arrow-up">
          <SvgArrow />
        </span>
        <p className="number-channel">{currentChannel?.position}</p>
        <span className="arrow arrow-down">
          <SvgArrow />
        </span>
      </div>
      <div className="logo">
        <img
          src={currentChannel?.image}
          onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
          alt=""
        />
      </div>
      <div className="name-channel">
        <p>{currentChannel?.name}</p>
      </div>
    </>
  );
});
