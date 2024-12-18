import { memo, useRef, useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatTime } from "@utils/util";
import { setPaused } from "@app/player/playerSlice";
import LOCAL_STORAGE from "@utils/localStorage";
import HlsPlayer from "./components/HlsPlayer";
import LiveControls from "@components/live/LiveControls.jsx";
import AndroidPlayer from "./components/AndroidPlayer";
import { useTranslation } from "react-i18next";
import {
  selectPlayerType,
  selectCurrentChannel,
} from "@app/channels/channelsSlice";
import { useToast } from "@hooks/useToast";
import VodControls from "./components/VodControl";
import {
  setIsPlayerOpen,
  setAudioTracks,
  setResolutions,
  setSubtitles,
  selectSelectedSubtitle,
  selectSelectedQuality,
  selectSelectedAudio,
  selectSubtitles,
  selectAudioTracks,
  selectResolutions,
} from "@app/global";

import { GoogleIMA } from "../../GoogleIMA";

import "./styles/player.scss";
import { setMoviesView, setChannelsView } from "@server/requests";

let timeout = null;

const isHlsUrl = (url) => {
  return url.includes(".m3u8") || url.includes(".ts");
};

export default memo(function Player({
  type,
  url,
  pipMode,
  setUrl,
  setPipMode,
  refUrlLive,
  endedArchive,
  retryC,
  setRetryC,
  title,
  showProtected,
  onEnded,
  onRememberTime,
  startTime,
  onNextArchive,
  movieId,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const refVideo = useRef(null);
  const refDuration = useRef(null);
  const refCurrentTime = useRef(null);
  const refProgress = useRef(null);
  const { retryOperation, showToast, hideToast } = useToast();
  const secCurrentTime = useRef(0);
  // const secDuration = useRef(0);
  const lastRememberTimeUpdate = useRef(0);
  const maxRetries = 3;
  const adContainerRef = useRef(null);

  const audioTracks = useSelector(selectAudioTracks);
  const subtitles = useSelector(selectSubtitles);
  const resolutions = useSelector(selectResolutions);
  const selectedAudio = useSelector(selectSelectedAudio);
  const selectedSubtitle = useSelector(selectSelectedSubtitle);
  const selectedQuality = useSelector(selectSelectedQuality);
  const [isPlayedOnce, setIsPlayedOnce] = useState(false);

  const [secDuration, setSecDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [alreadyRetryed, setAlreadyRetryed] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [adTagUrl, setAdTagUrl] = useState(
    "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
  ); // Set this from your ad server
  const [cTime, setCTime] = useState(0);
  const cTimeRef = useRef(0);
  const durationRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const viewDurationRef = useRef(0);
  const isStartRef = useRef(true);
  const intervalRef = useRef(null);
  const isAdPlayingRef = useRef(false);

  const [movieCurrentTime, setMovieCurrentTime] = useState(0);

  const playerType = useSelector(selectPlayerType);
  const currentChannel = useSelector(selectCurrentChannel);

  const lastTimeRef = useRef(0);
  const bufferingStartTimeRef = useRef(null);
  const totalBufferingTimeRef = useRef(0);

  const handleBufferingStart = () => {
    if (type === "live") {
      bufferingStartTimeRef.current = Date.now();
    }
  };

  const handleBufferingEnd = () => {
    if (type === "live" && bufferingStartTimeRef.current) {
      const bufferingDuration =
        (Date.now() - bufferingStartTimeRef.current) / 1000; // convert to seconds
      totalBufferingTimeRef.current += bufferingDuration;
      bufferingStartTimeRef.current = null;
    }
  };

  const play = () => {
    if (!window.Android) {
      refVideo.current.play();
    } else {
      window.Android.play();
    }
    dispatch(setPaused(false));
    setIsPlaying(true);
  };

  const pause = () => {
    console.warn("pause");
    if (!window.Android) {
      refVideo.current.pause();
    } else {
      window.Android.pause();
    }
    dispatch(setPaused(true));
    setIsPlaying(false);
  };

  const loadedMetadataHandler = useCallback(() => {
    hideToast();
    if (window.Android) {
      durationRef.current = window.Android.getDuration();
    } else if (refVideo.current) {
      durationRef.current = refVideo.current.duration;
    }

    if (startTime) {
      if (refVideo.current) {
        refVideo.current.currentTime = startTime;
      }
    }
    play();
  }, [startTime, durationRef]);

  const handleTimeUpdate = (currentTime, duration) => {
    secCurrentTime.current = currentTime;
    setSecDuration(duration);
    setMovieCurrentTime(currentTime);
    cTimeRef.current = currentTime;
    if (Math.floor(currentTime) >= duration - 1) {
      if (type === "vod") {
        onEnded();
      } else {
        if (onNextArchive) {
          onNextArchive();
        } else {
          endedArchive();
        }
      }
    } else {
      if (refDuration.current) {
        refDuration.current.innerHTML = formatTime(duration);
      }
      if (refCurrentTime.current) {
        refCurrentTime.current.innerHTML = formatTime(currentTime);
      }
      if (refProgress.current) {
        refProgress.current.style.width = `${(currentTime / duration) * 100}%`;
      }

      // Remember time logic
      if (type === "vod" && currentTime > 0) {
        const now = Date.now();
        if (now - lastRememberTimeUpdate.current >= 15000) {
          // 15 seconds
          const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
          onRememberTime(Math.floor(currentTime), percent);
          lastRememberTimeUpdate.current = now;
        }
      }
    }
  };

  const streamEnd = () => {
    if (type === "live") {
      if (playerType !== "live") {
        endedArchive();
      }
    }
  };

  const onBack = () => {
    const currentTime = Math.floor(secCurrentTime.current);
    const percent = (currentTime / secDuration) * 100;
    onRememberTime(currentTime, percent, true);

    if (window.Android && type === "vod") {
      window.Android.destroyPlayer();
    }
  };

  const retryPlayback = useCallback(async () => {
    if (!refVideo.current) return;

    return new Promise((resolve, reject) => {
      if (!window.Android) {
        if (refVideo.current) {
          refVideo.current.load();
          refVideo.current.play().then(resolve).catch(reject);
        }
      } else {
        try {
          window.Android.reload();
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  }, [refVideo.current]);

  const onErrorHandler = async (err) => {
    if (retryC < maxRetries) {
      showToast(
        `Attempting to replay... (${retryC + 1}/${maxRetries})`,
        "retrying",
      );
    } else {
      hideToast();
      setAlreadyRetryed(true);
      showToast(
        t("Unable to play video. Please try again later."),
        "error",
        5000,
      );
      setRetryC(0);
      return;
    }

    setRetryC(retryC + 1);
    try {
      await retryPlayback();
      setRetryC(0);
    } catch (error) {
      console.error("All retry attempts failed:", error);
    }
  };

  const seekByClick = (time) => {
    if (window.Android) {
      window.Android.seekTo(time);
    } else {
      refVideo.current.currentTime = time;
    }

    setMovieCurrentTime(time);
  };

  const updateSeekTimeDelayed = (time) => {
    timeout = setTimeout(() => {
      seekByClick(time);
      play();
    }, 1000);
  };

  const handleSeek = (direction, seconds = 10) => {
    pause();
    clearTimeout(timeout);

    setCTime((old) =>
      direction === "forward" ? old + seconds : old - seconds,
    );
    cTimeRef.current =
      direction === "forward"
        ? cTimeRef.current + seconds
        : cTimeRef.current - seconds;

    updateSeekTimeDelayed(cTimeRef.current);
  };

  const getTracksHandler = (tracksList) => {
    dispatch(setAudioTracks(tracksList.audio));
    dispatch(setSubtitles(tracksList.subtitles));
    dispatch(setResolutions(tracksList.video));
  };

  useEffect(() => {
    if (subtitles) {
      if (window.Android) {
        if (selectedSubtitle && selectedSubtitle.id !== "Off") {
          const foundIndex = subtitles.findIndex(
            (subtitle) => subtitle.id == selectedSubtitle.id,
          );
          window.Android.selectTrack(
            "TEXT",
            subtitles[foundIndex].track_index,
            subtitles[foundIndex].group_index,
          );
        } else if (selectedSubtitle === "Off") {
          window.Android.selectTrack("TEXT", -1, -1);
        }
      }
    }
  }, [subtitles, selectedSubtitle]);

  useEffect(() => {
    if (audioTracks) {
      if (window.Android) {
        if (
          selectedAudio &&
          selectedAudio !== "Default" &&
          audioTracks.length
        ) {
          const foundIndex = audioTracks.findIndex(
            (audio) => audio.id == selectedAudio.id,
          );
          if (foundIndex !== -1) {
            window.Android.selectTrack(
              "AUDIO",
              audioTracks[foundIndex].track_index,
              audioTracks[foundIndex].group_index,
            );
          }
        } else if (selectedAudio === "Default") {
          window.Android.selectTrack("AUDIO", -1, -1);
        }
      }
    }
  }, [audioTracks, selectedAudio]);

  useEffect(() => {
    if (resolutions) {
      if (window.Android) {
        if (
          selectedQuality &&
          selectedQuality !== "Auto" &&
          resolutions.length
        ) {
          const foundIndex = resolutions.findIndex(
            (resolution) => resolution.id == selectedQuality.id,
          );
          if (foundIndex !== -1) {
            window.Android.selectTrack(
              "VIDEO",
              resolutions[foundIndex].track_index,
              resolutions[foundIndex].group_index,
            );
          }
        } else if (selectedQuality === "Auto") {
          window.Android.selectTrack("VIDEO", -1, -1);
        }
      }
    }
  }, [resolutions, selectedQuality]);

  useEffect(() => {
    document.addEventListener("playerError", onErrorHandler);
    setRetryC(0);
    hideToast();

    return () => {
      document.removeEventListener("playerError", onErrorHandler);
    };
  }, [url]);

  useEffect(() => {
    dispatch(setIsPlayerOpen(true));

    return () => {
      dispatch(setIsPlayerOpen(false));
    };
  }, []);

  useEffect(() => {
    if (adContainerRef.current && !window.Android) {
      // GoogleIMA.init({
      //   timeout: 0,
      //   adTagUrl: adTagUrl,
      //   adContainer: adContainerRef.current,
      //   events: {
      //     onAdStarted: () => {
      //       console.log("on add start");
      //       isAdPlayingRef.current = true;
      //       if (refVideo.current) {
      //         refVideo.current.pause();
      //       }
      //     },
      //     onAdEnded: () => {
      //       isAdPlayingRef.current = false;
      //       if (refVideo.current) {
      //         refVideo.current.play();
      //       }
      //     },
      //     onAdError: (err) => {
      //       console.log("on add error");
      //       isAdPlayingRef.current = false;
      //       console.error("Ad error:", err);
      //       if (refVideo.current) {
      //         refVideo.current.play();
      //       }
      //     },
      //   },
      // });
    }

    return () => {
      GoogleIMA.destroy();
    };
  }, [adTagUrl, adContainerRef.current]);

  const sendViewRequest = async (duration) => {
    try {
      if (type === "live") {
        const effectiveTime = Math.max(0, 10 - totalBufferingTimeRef.current);

        await setChannelsView({
          is_start: isStartRef.current,
          channel_id: currentChannel?.id,
          view_duration: Math.floor(effectiveTime),
        });

        totalBufferingTimeRef.current = 0;
      } else {
        await setMoviesView({
          is_start: isStartRef.current,
          movie_id: movieId,
          view_duration: duration,
        });
      }

      if (isStartRef.current) {
        isStartRef.current = false;
      }

      lastTimeRef.current = Math.floor(refVideo.current?.currentTime || 0);
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  useEffect(() => {
    if (window.Android) {
      window.Android.onBufferingStart = handleBufferingStart;
      window.Android.onBufferingEnd = handleBufferingEnd;
    }

    intervalRef.current = setInterval(async () => {
      if (isAdPlayingRef.current || !refVideo.current) return;

      if (type === "live") {
        await sendViewRequest();
      } else {
        const currentTime = Math.floor(refVideo.current.currentTime);
        const watchedDuration = currentTime - lastTimeRef.current;

        if (watchedDuration > 0) {
          await sendViewRequest(watchedDuration);
        }
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (window.Android) {
        window.Android.onBufferingStart = null;
        window.Android.onBufferingEnd = null;
      }
    };
  }, [type === "live" ? currentChannel?.id : movieId]);

  const renderPlayer = () => {
    if (!url) return null;

    if (LOCAL_STORAGE.DEVICE_OS.GET() === "android") {
      return (
        <AndroidPlayer
          url={url}
          timeUpdate={handleTimeUpdate}
          streamEnd={streamEnd}
          time={startTime}
          startTime={startTime}
          onBack={onBack}
          onError={onErrorHandler}
          onLoadedMetadata={loadedMetadataHandler}
          onSeek={handleSeek}
          getTracks={getTracksHandler}
        />
      );
    }

    if (isHlsUrl(url)) {
      return (
        <HlsPlayer
          refVideo={refVideo}
          url={url}
          timeUpdate={handleTimeUpdate}
          streamEnd={streamEnd}
          error={onErrorHandler}
          loadVideo={loadedMetadataHandler}
          startTime={startTime}
        />
      );
    }

    // Fallback to native HTML5 video player for non-HLS URLs
    return (
      <video
        ref={refVideo}
        src={url}
        id="video_player"
        onTimeUpdate={() =>
          handleTimeUpdate(
            refVideo.current.currentTime,
            refVideo.current.duration,
          )
        }
        onEnded={streamEnd}
        onLoadedMetadata={loadedMetadataHandler}
        onError={onErrorHandler}
        onWaiting={() => console.log("Video is waiting")}
        autoPlay
        playsInline
      />
    );
  };

  return (
    <>
      <div ref={adContainerRef} id="adContainerRef"></div>
      <div id="controls_player">
        {type === "live" && !pipMode && (
          <LiveControls
            showProtected={showProtected}
            setUrl={setUrl}
            url={url}
            refUrlLive={refUrlLive}
            durationRef={refDuration}
            currentTimeRef={refCurrentTime}
            setPipMode={setPipMode}
            refProgress={refProgress}
            secCurrentTime={secCurrentTime}
            secDuration={secDuration}
            cTime={cTimeRef.current}
            changeCTime={seekByClick}
            refVideo={refVideo}
            play={play}
            pause={pause}
            seekToHandler={handleSeek}
            seekByClick={seekByClick}
            duration={secDuration}
          />
        )}
        {type === "vod" && !pipMode && (
          <VodControls
            durationRef={refDuration}
            currentTimeRef={refCurrentTime}
            refProgress={refProgress}
            secCurrentTime={secCurrentTime}
            secDuration={secDuration}
            refVideo={refVideo}
            play={play}
            pause={pause}
            onBack={onBack}
            title={title}
            seekToHandler={handleSeek}
            movieCurrentTime={cTimeRef.current}
            setMovieCurrentTime={seekByClick}
            duration={durationRef.current}
          />
        )}
      </div>
      {renderPlayer()}
    </>
  );
});
