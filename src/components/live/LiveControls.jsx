import { memo, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChannel,
  selectPlayerType,
  selectAllChannels,
  setCurrentChannel,
  setPlayerType,
} from "@app/channels/channelsSlice";
import {
  setShowPreviewImages,
  selectShowPreviewImages,
  selectIsPaused,
} from "@app/player/playerSlice";
import { channelInfo } from "@server/requests";
import { formatTime } from "@utils/util";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import Duration from "../player/components/Duration";
import Progress from "../player/components/Progress";
import LiveIcon from "./components/LiveIcon";
import InfoLiveControl from "./components/InfoLiveControl";
import ArchiveButtons from "./components/ArchiveButtons";

import "./styles/LiveControl.scss";

let hideControlsTimer = null;

export default memo(function LiveControls({
  durationRef,
  currentTimeRef,
  setPipMode,
  setUrl,
  url,
  refProgress,
  refUrlLive,
  secCurrentTime,
  secDuration,
  refVideo,
  play,
  pause,
}) {
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const isPaused = useSelector(selectIsPaused);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);
  const timeOutNumber = useRef(null);
  const refVal = useRef(null);

  const currentTimeSeekto = useRef(0);

  const [number, setNumber] = useState("");
  const [active, setActive] = useState(0);
  const [hideControls, setHideControls] = useState(false);

  const findChannel = () => {
    if (allChannels.length <= 1) return;
    for (let i = 0; i < allChannels.length; i++) {
      if (allChannels[i].id === currentChannel.id) {
        if (i === 0) {
          refNextChannel.current = allChannels[i + 1];
          refPrevChannel.current = allChannels[allChannels.length - 1];
        } else if (i === allChannels.length - 1) {
          refNextChannel.current = allChannels[0];
          refPrevChannel.current = allChannels[i - 1];
        } else {
          refPrevChannel.current = allChannels[i - 1];
          refNextChannel.current = allChannels[i + 1];
        }
        break;
      }
    }
  };

  const getChannelInfo = async (id) => {
    const response = await channelInfo({ id: id });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
    } else {
      LOCAL_STORAGE.LAST_CHANNEL_ID.SET(id);
      dispatch(setCurrentChannel(message));
      setUrl(message.url);
    }
  };

  const numberChangeChannel = (num) => {
    let _number = Number(number + num.toString());

    if ((number + num.toString()).length <= 4) {
      setNumber(_number);
    } else return;

    clearTimeout(timeOutNumber.current);

    timeOutNumber.current = setTimeout(() => {
      findChannelByNumber(_number);
      setNumber("");
    }, 3000);
  };

  const findChannelByNumber = (num) => {
    let _channel = null;
    for (let i = 0; i < allChannels.length; i++) {
      if (allChannels[i].position === num) {
        getChannelInfo(allChannels[i].id);
        _channel = allChannels[i];
        break;
      } else if (
        num > allChannels[i].position &&
        allChannels[i + 1] &&
        num < allChannels[i + 1].position
      ) {
        _channel = allChannels[i];
        break;
      }
    }

    if (!_channel) _channel = allChannels[allChannels.length - 1];

    getChannelInfo(_channel.id);
  };

  const setUrlTimeshift = () => {
    if (currentChannel.cdn_url) {
      let _url =
        currentChannel.cdn_url +
        "/timeshift/" +
        currentChannel.id +
        "/index.m3u8";

      setUrl(_url);
    } else if (currentChannel.archived_channel_host) {
      let _url = "";
      if (currentChannel.archived_channel_host.indexOf("http") == -1)
        _url =
          "http://" +
          currentChannel.archived_channel_host +
          "/timeshift/" +
          currentChannel.id +
          "/index.m3u8";
      else
        _url =
          currentChannel.archived_channel_host +
          "/timeshift/" +
          currentChannel.id +
          "/index.m3u8";
      refUrlLive.current = url;
      setUrl(_url);
    }
  };

  const clickFrwdRewd = () => {
    if (secCurrentTime.current === 0) return;
    if (playerType !== "live") {
      if (!window.Android) refVideo.current.pause();
      currentTimeSeekto.current = Math.floor(secCurrentTime.current);
      refVal.current.innerText = formatTime(currentTimeSeekto.current);
      dispatch(setShowPreviewImages(true));
    }
  };

  useEffect(() => {
    return () => {
      dispatch(setShowPreviewImages(false));
      if (!isPaused) secCurrentTime.current = 0;
    };
  }, []);

  const showControl = () => {
    if (hideControls) setHideControls(false);

    clearTimeout(hideControlsTimer);

    hideControlsTimer = setTimeout(() => {
      setHideControls(true);
    }, 3000);
  };

  useEffect(() => {
    findChannel();
  }, [currentChannel]);

  useKeydown({
    isActive: showPreviewImages,

    back: () => {
      if (!window.Android) {
        if (!isPaused) refVideo.current.play();
      }
      dispatch(setShowPreviewImages(false));
      if (!isPaused) secCurrentTime.current = 0;
    },

    left: () => {
      if (!window.Android) refVideo.current.pause();

      if (currentTimeSeekto.current - 10 >= 0) {
        currentTimeSeekto.current = currentTimeSeekto.current - 10;
        refVal.current.innerText = formatTime(currentTimeSeekto.current);
        refProgress.current.style.width = `${(currentTimeSeekto.current / secDuration.current) * 100}%`;
      }
    },

    right: () => {
      if (!window.Android) refVideo.current.pause();

      if (currentTimeSeekto.current + 10 <= secDuration.current) {
        currentTimeSeekto.current = currentTimeSeekto.current + 10;
        refVal.current.innerText = formatTime(currentTimeSeekto.current);
        refProgress.current.style.width = `${(currentTimeSeekto.current / secDuration.current) * 100}%`;
      }
    },

    ok: () => {
      if (!window.Android) {
        refVideo.current.currentTime = currentTimeSeekto.current;
        if (!isPaused) refVideo.current.play();
      }
      dispatch(setShowPreviewImages(false));
      if (!isPaused) secCurrentTime.current = 0;
    },
  });

  useKeydown({
    isActive: playerType === "live" && !showPreviewImages,

    number: (e) => {
      showControl();
      if (hideControls) return;
      numberChangeChannel(e.key);
    },

    left: () => {
      showControl();
      if (hideControls) return;
      setActive(0);
    },

    right: () => {
      showControl();
      if (hideControls) return;
      if (currentChannel?.has_archive) setActive(1);
    },

    up: () => {
      showControl();
      if (hideControls) return;
      if (refNextChannel.current) {
        setActive(0);
        getChannelInfo(refNextChannel.current.id);
      }
    },

    down: () => {
      showControl();
      if (hideControls) return;
      if (refPrevChannel.current) {
        setActive(0);
        getChannelInfo(refPrevChannel.current.id);
      }
    },

    ok: () => {
      showControl();
      if (hideControls) return;
      if (active === 0) {
        setPipMode(true);
        window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
      } else if (active === 1) {
        // show timeshift
        setUrlTimeshift();
        // setUrl(
        //   "http://playertest.longtailvideo.com/adaptive/wowzaid3/playlist.m3u8"
        // );
        setActive(2);
        dispatch(setPlayerType("timeshift"));
      }
    },
  });

  useKeydown({
    isActive:
      (playerType === "timeshift" || playerType === "archive") &&
      !showPreviewImages,

    number: (e) => {
      showControl();
      if (hideControls) return;
      numberChangeChannel(e.key);
    },

    left: () => {
      showControl();
      if (hideControls) return;
      if (active === 0) return;

      setActive(active - 1);
    },

    right: () => {
      showControl();
      if (hideControls) return;
      if (playerType === "archive" && active === 3) return;
      if (active === 4) return;
      setActive(active + 1);
    },

    up: () => {
      showControl();
      if (hideControls) return;
      if (refNextChannel.current && active === 0) {
        dispatch(setPlayerType("live"));
        getChannelInfo(refNextChannel.current.id);
      }
    },

    down: () => {
      showControl();
      if (hideControls) return;
      if (refPrevChannel.current && active === 0) {
        dispatch(setPlayerType("live"));
        getChannelInfo(refPrevChannel.current.id);
      }
    },

    ok: () => {
      showControl();
      if (hideControls) return;
      if (active === 0) {
        setPipMode(true);
        window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
      } else if (active === 2) {
        secCurrentTime.current = 0;
        if (isPaused) play();
        else pause();
      } else if (active === 1 || active === 3) {
        clickFrwdRewd();
      } else if (active === 4) {
        setActive(0);
        setUrl(refUrlLive.current);
        dispatch(setPlayerType("live"));
      }
    },
  });

  return (
    <>
      {number ? <p className="num-change-channel">{number}</p> : null}
      <div
        className={`live-control${hideControls ? " hide" : ""}${showPreviewImages ? " preview" : ""}`}
      >
        <InfoLiveControl
          playerType={playerType}
          currentChannel={currentChannel}
          active={active}
        />
        <div className="progress-field">
          <Progress
            playerType={playerType}
            color="#FFFFFF"
            refProgress={refProgress}
            refVal={refVal}
          />
          {playerType === "live" ? (
            <LiveIcon type={playerType} />
          ) : playerType === "timeshift" ? (
            <>
              <ArchiveButtons
                play={play}
                pause={pause}
                type={playerType}
                active={active}
              />
              <LiveIcon type={playerType} isActive={active === 4} />
              <Duration
                _ref={currentTimeRef}
                className={"timeshift-duration"}
              />
            </>
          ) : (
            <>
              <ArchiveButtons
                play={play}
                pause={pause}
                type={playerType}
                active={active}
              />
              <Duration _ref={durationRef} className={"archive-duration"} />
              <Duration
                _ref={currentTimeRef}
                className={"archive-current_time"}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
});
