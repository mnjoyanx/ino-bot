import React, { memo, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatTime } from "@utils/util";
import { setPaused, selectIsPaused } from "@app/player/playerSlice";
import useKeydown from "@hooks/useKeydown";
import Progress from "./Progress";
import Duration from "./Duration";
import { selectCtrl, setIsPlayerOpen, setCtrl } from "@app/global";
import Button from "../../common/Button";
import SvgPlay from "@assets/images/player/SvgPlay";
import SvgPause from "@assets/images/player/SvgPause";
import SvgRewind from "@assets/icons/SvgRewind";
import SvgForward from "@assets/icons/SvgForward";
import SvgSettings from "@assets/icons/SvgSettings";
import PlaybackActions from "./PlaybackActions";

import "@styles/components/vodControl.scss";

let hideControlsTimer = null;

export default memo(function VodControls({
  durationRef,
  currentTimeRef,
  refProgress,
  secCurrentTime,
  secDuration,
  refVideo,
  play,
  pause,
  title,
}) {
  const dispatch = useDispatch();
  const isPaused = useSelector(selectIsPaused);
  const ctrl = useSelector(selectCtrl);
  const refVal = useRef(null);

  const [hideControls, setHideControls] = useState(true);
  const [active, setActive] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const showControl = () => {
    if (hideControls) setHideControls(false);

    clearTimeout(hideControlsTimer);

    hideControlsTimer = setTimeout(() => {
      // setHideControls(true);
    }, 3000);
  };

  useEffect(() => {
    showControl();
  }, []);

  const handleSeek = (direction) => {
    const currentTime = refVideo.current.currentTime;
    const newTime =
      direction === "forward" ? currentTime + 10 : currentTime - 10;
    refVideo.current.currentTime = Math.max(
      0,
      Math.min(newTime, refVideo.current.duration)
    );
    showControl();
  };

  useKeydown({
    isActive: ctrl === "vodCtrl",

    left: () => {
      if (active === 0) {
        handleSeek("backward");
      } else {
        if (active > 1) {
          setActive(active - 1);
        }
      }
    },
    right: () => {
      if (active === 0) {
        handleSeek("forward");
      } else {
        if (active > 0 && active < 3) {
          setActive(active + 1);
        }
      }
    },

    up: () => {
      setActive(0);
    },

    down: () => {
      setActive(1);
    },

    pause: () => {
      if (isPaused) play();
      else pause();
    },

    play: () => {
      if (isPaused) play();
      else pause();
    },
    ok: () => {
      if (isPaused) play();
      else pause();
    },

    back: () => {
      //   if (!hideControls) {
      //     setHideControls(false);
      //   } else {
      dispatch(setIsPlayerOpen(false));
      dispatch(setCtrl("movieInfo"));
      //   }
    },

    move: () => {
      //   showControl();
    },
  });

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    showControl();
  };

  return (
    <>
      <div className="playback-actions_wrapper">
        <PlaybackActions isPaused={isPaused} />
      </div>
      <div className={`vod-control${hideControls ? " hide" : ""}`}>
        <div className="vod-info">
          <h2 className="vod-title">{title}</h2>
        </div>

        <div className="progress-field">
          <Progress
            color="#FFFFFF"
            refProgress={refProgress}
            refVal={refVal}
            classNames="vod_progress"
          />
          <div className="vod-actions_wrapper">
            <div className="vod-control-btns">
              {/* <div className="vod-ctrl_btn">
                {isPaused ? <SvgPlay /> : <SvgPause />}
              </div> */}
              <Duration _ref={currentTimeRef} className="vod-current_time" />
              <Duration _ref={durationRef} className="vod_duration" />
            </div>
            <div className="vod-ctrl_btn">
              <SvgSettings />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
