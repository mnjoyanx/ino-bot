import React, { memo, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setPaused, selectIsPaused } from "@app/player/playerSlice";
import useKeydown from "@hooks/useKeydown";
import Progress from "./Progress";
import Duration from "./Duration";
import { selectCtrl, setIsPlayerOpen, setCtrl } from "@app/global";
import SvgSettings from "@assets/icons/SvgSettings";
import PlaybackActions from "./PlaybackActions";
import ControlSettings from "./ControlSettings";
import SvgNextEpisode from "@assets/icons/SvgNextEpisode";
import { useMovieInfo } from "@context/movieInfoContext";

import "@styles/components/vodControl.scss";

let hideControlsTimer = null;

export default memo(function VodControls({
  durationRef,
  currentTimeRef,
  refProgress,
  refVideo,
  play,
  pause,
  title,
  onBack,
  hasNextEpisode,
}) {
  const dispatch = useDispatch();
  const isPaused = useSelector(selectIsPaused);
  const ctrl = useSelector(selectCtrl);

  const { isLastEpisode } = useMovieInfo();

  const [hideControls, setHideControls] = useState(false);
  const [activeCtrl, setActiveCtrl] = useState("top");
  const [topActiveIndex, setTopActiveIndex] = useState(1);
  const [isSettingsActive, setIsSettingsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const controlsRef = useRef(null);

  const showControl = () => {
    setHideControls(false);
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      setHideControls(true);
    }, 3000);
  };

  useEffect(() => {
    showControl();

    const handleMouseMove = () => {
      showControl();
    };

    const playerElement = refVideo.current?.parentElement;
    if (playerElement) {
      playerElement.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (playerElement) {
        playerElement.removeEventListener("mousemove", handleMouseMove);
      }
      clearTimeout(hideControlsTimer);
    };
  }, [refVideo]);

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

  const handleSettingsClick = () => {
    setShowSettings(true);
    dispatch(setCtrl("settings"));
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    dispatch(setCtrl("vodCtrl"));
  };

  useKeydown({
    isActive: ctrl === "vodCtrl",
    left: () => {
      if (activeCtrl === "top") {
        setTopActiveIndex((prev) => Math.max(0, prev - 1));
      }
      showControl();
    },
    right: () => {
      if (activeCtrl === "top") {
        setTopActiveIndex((prev) => Math.min(2, prev + 1));
      }
      showControl();
    },
    down: () => {
      setActiveCtrl("bottom");
      setIsSettingsActive(true);
      showControl();
    },
    up: () => {
      setActiveCtrl("top");
      setIsSettingsActive(false);
      showControl();
    },
    ok: () => {
      if (activeCtrl === "top") {
        if (topActiveIndex === 0) handleSeek("backward");
        else if (topActiveIndex === 1) isPaused ? play() : pause();
        else if (topActiveIndex === 2) handleSeek("forward");
      } else {
        handleSettingsClick();
      }
      showControl();
    },
    back: () => {
      onBack();
      dispatch(setIsPlayerOpen(false));
      dispatch(setCtrl("movieInfo"));
    },
  });

  const handleSeekTo = (seekTime) => {
    if (refVideo.current) {
      refVideo.current.currentTime = seekTime;
    }
    showControl();
  };

  const handleNextEpisode = () => {
    document.dispatchEvent(new Event("next-episode"));
  };

  return (
    <>
      <div
        className={`vod-control${hideControls ? " hide" : ""}`}
        ref={controlsRef}
      >
        <div className="vod-info">
          <h2 className="vod-title">{title}</h2>
        </div>

        <div className="playback-actions_wrapper">
          <PlaybackActions
            isPaused={isPaused}
            activeIndex={activeCtrl === "top" ? topActiveIndex : -1}
            onSeek={handleSeek}
            onPlayPause={() => (isPaused ? play() : pause())}
          />
        </div>

        <div className="progress-field">
          <Progress
            color="#FFFFFF"
            refProgress={refProgress}
            classNames="vod_progress"
            duration={refVideo.current ? refVideo.current.duration : 0}
            onSeekTo={handleSeekTo}
          />
          <div className="vod-actions_wrapper">
            <div className="vod-ctrl_times">
              <Duration _ref={currentTimeRef} className="vod-current_time" />
              <Duration _ref={durationRef} className="vod_duration" />
            </div>
            {!isLastEpisode && (
              <button
                className="vod-ctrl_btn next-episode-btn"
                onClick={handleNextEpisode}
              >
                <SvgNextEpisode />
                <span>Next episode</span>
              </button>
            )}
            <button
              className={`vod-ctrl_btn settings-btn${isSettingsActive ? " active" : ""}`}
              onClick={handleSettingsClick}
            >
              <SvgSettings />
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <ControlSettings
          isVisible={showSettings}
          onClose={handleCloseSettings}
          showControl={showControl}
        />
      )}
    </>
  );
});
