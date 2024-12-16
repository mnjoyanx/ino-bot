import { memo, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsPaused } from "@app/player/playerSlice";
import SvgPlay from "@assets/images/player/SvgPlay.jsx";
import SvgRewind from "@assets/images/player/SvgRewind";
import SvgForward from "@assets/images/player/SvgForward";
import SvgPause from "@assets/images/player/SvgPause";
import { InoRow } from "@ino-ui/tv";
import { useTranslation } from "react-i18next";
import "../styles/ArchiveButtons.scss";
import LiveIcon from "./LiveIcon";

export default memo(function ArchiveButtons({
  play,
  pause,
  active,
  setActive,
  actionHandler,
  onLiveHandler,
}) {
  const { t } = useTranslation();
  const isPaused = useSelector(selectIsPaused);

  const [isOnLive, setIsOnLive] = useState(false);

  const handleClick = (e) => {
    if (isPaused) play();
    else pause();
  };

  return (
    <div className="archive-buttons_wrapper">
      <InoRow
        isActive={isOnLive}
        onDown={() => {
          setIsOnLive(false);
        }}
        onOk={onLiveHandler}
      >
        <LiveIcon type={"archive"} isActive={isOnLive} />
      </InoRow>

      <div className="buttons-group-live">
        <InoRow
          isActive={active && !isOnLive}
          onLeft={setActive}
          onOk={(_e, index) => {
            actionHandler(index);
          }}
          onUp={() => {
            setIsOnLive(true);
          }}
        >
          <div className={`rewind btn-group-live`}>
            <p className="archive-btn_text">-5 {t("MIN")}</p>
            <SvgRewind />
          </div>
          <div className={`rewind btn-group-live`}>
            <p className="archive-btn_text">-1 {t("MIN")}</p>
            <SvgRewind />
          </div>
          <div className={`rewind btn-group-live`}>
            <p className="archive-btn_text">-30 {t("SEC")}</p>
            <SvgRewind />
          </div>
          <div className={`play-pause btn-group-live`} onClick={handleClick}>
            {isPaused ? <SvgPlay /> : <SvgPause />}
          </div>
          <div className={`forward btn-group-live`}>
            <SvgForward />
            <p className="archive-btn_text">+30 {t("SEC")}</p>
          </div>
          <div className={`forward btn-group-live`}>
            <SvgForward />
            <p className="archive-btn_text">+1 {t("MIN")}</p>
          </div>
          <div className={`forward btn-group-live`}>
            <SvgForward />
            <p className="archive-btn_text">+5 {t("MIN")}</p>
          </div>
        </InoRow>
      </div>
    </div>
  );
});
