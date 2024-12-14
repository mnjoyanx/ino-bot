import React, { useMemo, useEffect, useRef, useState } from "react";
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
import { InoPlayerProgress } from "@ino-ui/tv";
import { useTranslation } from "react-i18next";

import "@styles/components/vodControl.scss";
import { formatTime } from "@utils/util";

let hideControlsTimer = null;

export default function VodControls({
  durationRef,
  duration,
  currentTimeRef,
  refVideo,
  play,
  pause,
  title,
  onBack,
  seekToHandler,
  movieCurrentTime,
  setMovieCurrentTime,
}) {
  const dispatch = useDispatch();
  const isPaused = useSelector(selectIsPaused);
  const ctrl = useSelector(selectCtrl);
  const { t } = useTranslation();
  const { isLastEpisode, movieInfo } = useMovieInfo();

  const [hideControls, setHideControls] = useState(false);
  const [activeCtrl, setActiveCtrl] = useState("top");
  const [topActiveIndex, setTopActiveIndex] = useState(1);
  const [bottomActiveIndex, setBottomActiveIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const controlsRef = useRef(null);

  const showControl = () => {
    setHideControls(false);
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      setHideControls(true);
      setShowSettings(false);
      dispatch(setCtrl("vodCtrl"));
    }, 3000);
  };

  const imitateTimeUpdate = (currentTime, duration) => {
    if (currentTimeRef.current) {
      currentTimeRef.current.innerHTML = formatTime(currentTime);
    }
    if (durationRef.current) {
      durationRef.current.innerHTML = formatTime(duration);
    }
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
    seekToHandler(direction);
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
      } else {
        setBottomActiveIndex((prev) => Math.max(0, prev - 1));
      }
      showControl();
    },
    right: () => {
      if (activeCtrl === "top") {
        setTopActiveIndex((prev) => Math.min(2, prev + 1));
      } else {
        const maxIndex = !isLastEpisode ? 1 : 0;
        setBottomActiveIndex((prev) => Math.min(maxIndex, prev + 1));
      }
      showControl();
    },
    down: () => {
      setActiveCtrl("bottom");
      if (movieInfo.type === "tv_show") {
        setBottomActiveIndex(0);
      } else {
        setBottomActiveIndex(1);
      }
      showControl();
    },
    up: () => {
      setActiveCtrl("top");
      setTopActiveIndex(1);
      showControl();
    },
    ok: () => {
      if (activeCtrl === "top") {
        if (topActiveIndex === 0) {
          if (window.Android) {
            const currentTime = window.Android.getCurrentTime();
            const duration = window.Android.getVideoDuration();
            imitateTimeUpdate(currentTime, duration);
          } else {
            imitateTimeUpdate(
              refVideo.current.currentTime,
              refVideo.current.duration,
            );
          }
          handleSeek("backward");
        } else if (topActiveIndex === 1) isPaused ? play() : pause();
        else if (topActiveIndex === 2) {
          if (window.Android) {
            const currentTime = window.Android.getCurrentTime();
            const duration = window.Android.getVideoDuration();
            imitateTimeUpdate(currentTime, duration);
          } else {
            imitateTimeUpdate(
              refVideo.current.currentTime,
              refVideo.current.duration,
            );
          }
          handleSeek("forward");
        }
      } else {
        if (bottomActiveIndex === 0 && !isLastEpisode) {
          handleNextEpisode();
        } else {
          handleSettingsClick();
        }
      }
      showControl();
    },
    back: () => {
      onBack();
      dispatch(setIsPlayerOpen(false));
      dispatch(setCtrl("movieInfo"));
    },
  });

  const handleNextEpisode = () => {
    document.dispatchEvent(new Event("next-episode"));
  };

  const videoDuration = window.Android
    ? window.Android.getVideoDuration()
    : refVideo.current?.duration;

  return (
    <>
      <div
        className={`vod-control${hideControls ? " hide" : ""}`}
        ref={controlsRef}
      >
        <div className="vod-info">
          <h2 className="vod-title">
            {movieInfo.translations ? movieInfo.translations.name : title}
          </h2>
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
          {" "}
          <InoPlayerProgress
            isActive={false}
            value={(movieCurrentTime / 50) * 100}
            duration={videoDuration}
            onChange={(value) => {
              setMovieCurrentTime((value * videoDuration) / 100);
            }}
            showTooltip={false}
            showTime={true}
          />
          <div className="vod-actions_wrapper">
            <div className="vod-ctrl_btns_right">
              {!isLastEpisode && movieInfo.type === "tv_show" && (
                <button
                  className={`vod-ctrl_btn next-episode-btn${
                    activeCtrl === "bottom" && bottomActiveIndex === 0
                      ? " active"
                      : ""
                  }`}
                  onClick={handleNextEpisode}
                >
                  <SvgNextEpisode />
                  <span>{t("Next episode")}</span>
                </button>
              )}
              <button
                className={`vod-ctrl_btn settings-btn${
                  activeCtrl === "bottom" &&
                  (!isLastEpisode
                    ? bottomActiveIndex === 1
                    : bottomActiveIndex === 0)
                    ? " active"
                    : ""
                }`}
                onClick={handleSettingsClick}
              >
                <SvgSettings />
              </button>
            </div>
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
}
