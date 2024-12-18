import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LOCAL_STORAGE from "@utils/localStorage";

import SvgArrow from "@assets/images/live/SvgArrow";
import SvgBackward from "../../../assets/images/live/backward";

export default memo(function InfoLiveControl({
  currentChannel,
  active,
  playerType,
}) {
  const { t } = useTranslation();
  const [logoSrc, setLogoSrc] = useState(LOCAL_STORAGE.LOGO.GET());

  useEffect(() => {
    if (currentChannel?.image) {
      setLogoSrc(currentChannel.image);
    }
  }, [currentChannel]);

  return (
    <>
      <div className="info-live-control_wrapper">
        <div
          className={`parent-number-channel${active === 0 ? " active" : ""}`}
        >
          <span className="arrow arrow-up">
            <SvgArrow />
          </span>
          <p className="number-channel">{currentChannel?.position}</p>
          <span className="arrow arrow-down">
            <SvgArrow />
          </span>
        </div>
        <div className="logo">
          {/* <img
            src={currentChannel?.image}
            // onLoad={(e) => {
            //   console.log(e, "----");
            // }}
            onLoad={(e) => {
              console.log(e, "----");
              alert("kkkk");
            }}
            onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
            alt=""
          /> */}

          <img
            src={logoSrc}
            onLoad={(e) => {
              if (currentChannel?.image) {
                e.target.src = currentChannel.image;
              }
            }}
            onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
            alt=""
          />
        </div>
        <div className="name-channel">
          <p>{currentChannel?.name}</p>
        </div>
      </div>

      {playerType === "live" ? (
        <>
          <div
            className={`timeshift-btn${active === 1 ? " active" : ""}`}
            style={{ opacity: currentChannel?.has_archive ? "1" : "0" }}
          >
            {/* <span className="timeshift-btn_text">{t("Archive")}</span> */}
            <SvgBackward />
          </div>
        </>
      ) : null}
    </>
  );
});
