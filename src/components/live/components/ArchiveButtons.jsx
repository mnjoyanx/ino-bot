import { memo, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsPaused } from "@app/player/playerSlice";
import SvgPlay from "@assets/images/player/SvgPlay.jsx";
import SvgRewind from "@assets/images/player/SvgRewind";
import SvgForward from "@assets/images/player/SvgForward";
import SvgPause from "@assets/images/player/SvgPause";
import { useTranslation } from "react-i18next";
import "../styles/ArchiveButtons.scss";
import useKeydown from "@hooks/useKeydown";

export default memo(function ArchiveButtons({
  play,
  pause,
  active,
  setActive,
  actionHandler,
  showControl,
  hideControls,
  hasArchive,
  onBackHandler,
}) {
  const { t } = useTranslation();
  const isPaused = useSelector(selectIsPaused);
  const [activeIndex, setActiveIndex] = useState(3);

  const handleClick = (e) => {
    if (hideControls) {
      showControl();
      return;
    }
    if (isPaused) play();
    else pause();
  };

  useKeydown({
    isActive: active,
    left: () => {
      if (hideControls) {
        showControl();
        return;
      }
      if (activeIndex === 0) {
        setActive(true);
        return;
      }
      setActiveIndex(activeIndex - 1);
    },
    right: () => {
      if (hideControls) {
        showControl();
        return;
      }
      if (activeIndex === 6) {
        setActive();
        return;
      }
      setActiveIndex(activeIndex + 1);
    },

    ok: () => {
      if (activeIndex === 3) {
        handleClick();
      } else {
        actionHandler(activeIndex);
      }
    },

    back: () => {
      onBackHandler();
    },
  });

  return (
    <div className="archive-buttons_wrapper">
      <div className="buttons-group-live">
        {hasArchive ? (
          <div
            className={`rewind btn-group-live ${activeIndex === 0 && active ? "active" : ""}`}
          >
            <p className="archive-btn_text">-5 {t("MIN")}</p>
            <SvgRewind />
          </div>
        ) : null}
        {hasArchive ? (
          <div
            className={`rewind btn-group-live ${activeIndex === 1 && active ? "active" : ""}`}
          >
            <p className="archive-btn_text">-1 {t("MIN")}</p>
            <SvgRewind />
          </div>
        ) : null}
        {hasArchive ? (
          <div
            className={`rewind btn-group-live ${activeIndex === 2 && active ? "active" : ""}`}
          >
            <p className="archive-btn_text">-30 {t("SEC")}</p>
            <SvgRewind />
          </div>
        ) : null}
        <div
          className={`play-pause btn-group-live ${activeIndex === 3 && active ? "active" : ""}`}
          onClick={handleClick}
        >
          {isPaused ? <SvgPlay /> : <SvgPause />}
        </div>
        {hasArchive ? (
          <div
            className={`forward btn-group-live ${activeIndex === 4 && active ? "active" : ""}`}
          >
            <SvgForward />
            <p className="archive-btn_text">+30 {t("SEC")}</p>
          </div>
        ) : null}
        {hasArchive ? (
          <div
            className={`forward btn-group-live ${activeIndex === 5 && active ? "active" : ""}`}
          >
            <SvgForward />
            <p className="archive-btn_text">+1 {t("MIN")}</p>
          </div>
        ) : null}
        {hasArchive ? (
          <div
            className={`forward btn-group-live ${activeIndex === 6 && active ? "active" : ""}`}
          >
            <SvgForward />
            <p className="archive-btn_text">+5 {t("MIN")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
});
