import { memo, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChannel,
  selectPlayerType,
  selectAllChannels,
  setCurrentChannel,
  setPlayerType,
} from "@app/channels/channelsSlice";
import { channelInfo } from "@server/requests";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import Duration from "../player/components/Duration";
import Progress from "../player/components/Progress";
import LiveIcon from "./components/LiveIcon";

import "./styles/LiveControl.scss";
import InfoLiveControl from "./components/InfoLiveControl";
import ArchiveButtons from "./components/ArchiveButtons";

export default memo(function LiveControls({
  durationRef,
  currentTimeRef,
  setPipMode,
  setUrl,
  url,
  refProgress,
  refUrlLive,
}) {
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);
  const timeOutNumber = useRef(null);

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

  useEffect(() => {
    findChannel();
  }, [currentChannel]);

  useEffect(() => {
    let hideControlsTimer = null;

    if (!hideControls) {
      hideControlsTimer = setTimeout(() => {
        setHideControls(true);
      }, 3000);
    }

    return () => {
      clearTimeout(hideControlsTimer);
    };
  }, [hideControls]);

  useKeydown({
    isActive: playerType === "live",

    number: (e) => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      numberChangeChannel(e.key);
    },

    left: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      setActive(0);
    },

    right: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (currentChannel?.has_archive) setActive(1);
    },

    up: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (refNextChannel.current) {
        setActive(0);
        getChannelInfo(refNextChannel.current.id);
      }
    },

    down: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (refPrevChannel.current) {
        setActive(0);
        getChannelInfo(refPrevChannel.current.id);
      }
    },

    ok: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
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
    isActive: playerType === "timeshift" || playerType === "archive",

    number: (e) => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      numberChangeChannel(e.key);
    },

    left: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (active === 0) return;

      setActive(active - 1);
    },

    right: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (playerType === "archive" && active === 3) return;
      if (active === 4) return;
      setActive(active + 1);
    },

    up: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (refNextChannel.current && active === 0) {
        dispatch(setPlayerType("live"));
        getChannelInfo(refNextChannel.current.id);
      }
    },

    down: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (refPrevChannel.current && active === 0) {
        dispatch(setPlayerType("live"));
        getChannelInfo(refPrevChannel.current.id);
      }
    },

    ok: () => {
      if (hideControls) {
        setHideControls(false);
        return;
      }
      if (active === 0) {
        setPipMode(true);
        window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
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
      <div className={`live-control${hideControls ? " hide" : ""}`}>
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
          />
          {playerType === "live" ? (
            <LiveIcon type={playerType} />
          ) : playerType === "timeshift" ? (
            <>
              <ArchiveButtons type={playerType} active={active} />
              <LiveIcon type={playerType} isActive={active === 4} />
              <Duration
                _ref={currentTimeRef}
                className={"timeshift-duration"}
              />
            </>
          ) : (
            <>
              <ArchiveButtons type={playerType} active={active} />
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
