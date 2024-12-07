import { memo, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChannel,
  selectPlayerType,
  selectAllChannels,
  setCurrentChannel,
  setPlayerType,
  selectChannels,
  setChannels,
} from "@app/channels/channelsSlice";
import {
  setShowPreviewImages,
  selectShowPreviewImages,
  selectIsPaused,
} from "@app/player/playerSlice";
import { channelInfo } from "@server/requests";
import { formatTime } from "@utils/util";
import { selectCtrl, setIsCategoriesOpen } from "@app/global";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import Duration from "../player/components/Duration";
import Progress from "../player/components/Progress";
import LiveIcon from "./components/LiveIcon";
import InfoLiveControl from "./components/InfoLiveControl";
import ArchiveButtons from "./components/ArchiveButtons";
import favImg from "../../assets/images/live/fav.png";
import favFill from "../../assets/images/live/favFill.png";

import "./styles/LiveControl.scss";
import { addLiveFavorite, removeLiveFavorite } from "../../server/requests";
import { InoPlayerProgress } from "@ino-ui/tv";

let hideControlsTimer = null;

export default memo(function LiveControls({
  durationRef,
  currentTimeRef,
  setPipMode,
  setUrl,
  showProtected,
  url,
  refProgress,
  refUrlLive,
  secCurrentTime,
  secDuration,
  refVideo,
  play,
  pause,
  seekToHandler,
  seekByClick,
  cTime,
  changeCTime,
  duration,
}) {
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const isPaused = useSelector(selectIsPaused);
  const ctrl = useSelector(selectCtrl);
  const categoryChannels = useSelector(selectChannels);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);
  const timeOutNumber = useRef(null);
  const refVal = useRef(null);

  const currentTimeSeekto = useRef(0);

  const [number, setNumber] = useState("");
  const [active, setActive] = useState(0);
  const [hideControls, setHideControls] = useState(false);

  const channelChangeTimeout = useRef(null);

  const [displayChannel, setDisplayChannel] = useState(null);

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
      let _url = message.url;

      if (message.stream_type === "internal" && LOCAL_STORAGE.TOKEN.GET()) {
        _url += "?token=" + LOCAL_STORAGE.TOKEN.GET();
      }

      LOCAL_STORAGE.LAST_CHANNEL_ID.SET(id);
      dispatch(setCurrentChannel(message));

      if (message.is_protected) {
        showProtected();
      } else {
        setUrl(_url);
      }
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
    } else if (currentChannel.archived_channel) {
      let _url = "";

      if (currentChannel.archived_channel?.archiver?.ip) {
        _url =
          currentChannel.archived_channel?.archiver.ip +
          "/timeshift/" +
          currentChannel.id +
          "/index.m3u8";
      }

      setUrl(_url);
    }
  };

  const toggleFavorite = async (isAdd) => {
    try {
      if (isAdd) {
        dispatch(setCurrentChannel({ ...currentChannel, favorite: true }));
        const res = await addLiveFavorite({ channel_id: currentChannel.id });

        const categoryChannelsClone = JSON.parse(
          JSON.stringify(categoryChannels),
        );

        if (categoryChannelsClone) {
          if (!categoryChannelsClone.favorites) {
            categoryChannelsClone.favorites = {
              content: [],
              total: 0,
            };
          }
          const filteredCatChannels = [
            ...categoryChannelsClone.favorites.content,
            currentChannel,
          ];

          categoryChannelsClone.favorites.content = filteredCatChannels;
          categoryChannelsClone.favorites.total = filteredCatChannels.length;

          dispatch(setChannels(categoryChannelsClone));
        }

        const parsedRes = JSON.parse(res);
        if (parsedRes.error) {
          dispatch(setCurrentChannel({ ...currentChannel, favorite: false }));
        }
      } else {
        dispatch(setCurrentChannel({ ...currentChannel, favorite: false }));
        const res = await removeLiveFavorite({ channel_id: currentChannel.id });
        const categoryChannelsClone = JSON.parse(
          JSON.stringify(categoryChannels),
        );

        console.log(categoryChannelsClone, "categoryChannelsClone");

        if (categoryChannelsClone && categoryChannelsClone.favorites) {
          const filteredCatChannels =
            categoryChannelsClone.favorites.content.filter(
              (channel) => channel.id !== currentChannel.id,
            );

          categoryChannelsClone.favorites.content = filteredCatChannels;
          categoryChannelsClone.favorites.total = filteredCatChannels.length;

          dispatch(setChannels(categoryChannelsClone));
        }

        const parsedRes = JSON.parse(res);
        if (parsedRes.error) {
          dispatch(setCurrentChannel({ ...currentChannel, favorite: true }));
        }
      }
    } catch (err) {
      dispatch(setCurrentChannel({ ...currentChannel, favorite: !isAdd }));
    }
  };

  const handleArchiveAction = (index) => {
    switch (index) {
      case 0:
        seekToHandler("rewind", 300);
        break;
      case 1:
        seekToHandler("rewind", 60);
        break;
      case 2:
        seekToHandler("rewind", 30);
        break;
      case 3:
        if (isPaused) play();
        else pause();
        break;
      case 4:
        seekToHandler("forward", 30);
        break;
      case 5:
        seekToHandler("forward", 60);
        break;
      case 6:
        seekToHandler("forward", 300);
        break;
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
    }, 5000);
  };

  useEffect(() => {
    findChannel();
    showControl();
  }, [currentChannel]);

  const leftKeyPrevImage = () => {
    if (!window.Android) refVideo.current.pause();
    else window.Android.pause();

    if (currentTimeSeekto.current - 10 >= 0) {
      currentTimeSeekto.current = currentTimeSeekto.current - 10;
      refVal.current.innerText = formatTime(currentTimeSeekto.current);
      refProgress.current.style.width = `${(currentTimeSeekto.current / secDuration) * 100}%`;
    }
  };

  const rightKeyNextImage = () => {
    if (!window.Android) refVideo.current.pause();
    else window.Android.pause();

    if (currentTimeSeekto.current + 10 <= secDuration) {
      currentTimeSeekto.current = currentTimeSeekto.current + 10;
      refVal.current.innerText = formatTime(currentTimeSeekto.current);
      refProgress.current.style.width = `${(currentTimeSeekto.current / secDuration) * 100}%`;
    }
  };

  const nextChannel = () => {
    showControl();
    if (hideControls) return;
    if (refNextChannel.current) {
      if (channelChangeTimeout.current) {
        clearTimeout(channelChangeTimeout.current);
      }

      setDisplayChannel(refNextChannel.current.position);
      setActive(0);

      channelChangeTimeout.current = setTimeout(() => {
        setDisplayChannel(null);
        getChannelInfo(refNextChannel.current.id);
      }, 200);
    }
  };

  const prevChannel = () => {
    showControl();
    if (hideControls) return;
    if (refPrevChannel.current) {
      if (channelChangeTimeout.current) {
        clearTimeout(channelChangeTimeout.current);
      }

      setDisplayChannel(refPrevChannel.current.position);
      setActive(0);

      channelChangeTimeout.current = setTimeout(() => {
        setDisplayChannel(null);
        getChannelInfo(refPrevChannel.current.id);
      }, 200);
    }
  };

  useKeydown({
    isActive: showPreviewImages && ctrl !== "protected",

    back: () => {
      if (!window.Android) {
        if (!isPaused) refVideo.current.play();
      } else {
        window.Android.play();
      }
      dispatch(setShowPreviewImages(false));
      if (!isPaused) secCurrentTime.current = 0;
    },

    fast_prev: leftKeyPrevImage,

    fast_next: rightKeyNextImage,

    prev: leftKeyPrevImage,

    next: rightKeyNextImage,

    left: leftKeyPrevImage,

    right: rightKeyNextImage,

    ok: () => {
      if (!window.Android) {
        refVideo.current.currentTime = currentTimeSeekto.current;
        if (!isPaused) refVideo.current.play();
      } else {
        window.Android.seekTo(currentTimeSeekto.current);
        if (!isPaused) window.Android.play();
      }
      dispatch(setShowPreviewImages(false));
      if (!isPaused) secCurrentTime.current = 0;
    },
  });

  useKeydown({
    isActive:
      playerType === "live" && !showPreviewImages && ctrl !== "protected",

    number: (e) => {
      showControl();
      if (hideControls) return;
      numberChangeChannel(e.key);
    },

    left: () => {
      showControl();
      if (hideControls) return;
      if (currentChannel?.has_archive) {
        if (active < 1) return;
        setActive(active - 1);
      } else {
        setActive(0);
      }
    },

    right: () => {
      showControl();
      if (hideControls) return;
      // if (currentChannel?.has_archive) setActive(1);

      if (currentChannel?.has_archive) {
        if (active < 2) {
          setActive(active + 1);
        } else {
          if (active < 1) {
            setActive(active + 1);
          }
        }
      } else {
        setActive(2);
      }
    },

    up: nextChannel,

    down: prevChannel,

    ok: () => {
      showControl();
      if (hideControls) return;
      if (active === 0) {
        setPipMode(true);
        window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
      } else if (active === 1) {
        // Store current channel info before switching to timeshift
        if (playerType === "live") {
          refUrlLive.current = {
            url: url,
            channelId: currentChannel.id,
          };
        }
        setUrlTimeshift();
        setActive(2);
        dispatch(setPlayerType("timeshift"));
      } else if (active === 2) {
        toggleFavorite(!currentChannel.favorite);
      } else if (active === 4) {
        setActive(0);
        if (currentChannel) {
          if (
            refUrlLive.current &&
            refUrlLive.current.channelId === currentChannel.id
          ) {
            // Same channel, can use stored URL
            setUrl(refUrlLive.current.url);
          } else {
            // Channel changed or no stored URL, get fresh channel info
            getChannelInfo(currentChannel.id);
          }
        }
        dispatch(setPlayerType("live"));
      }
    },

    back: () => {
      dispatch(setIsCategoriesOpen(true));
      setPipMode(true);
      window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
    },
  });

  useKeydown({
    isActive:
      (playerType === "timeshift" || playerType === "archive") &&
      !showPreviewImages &&
      ctrl !== "protected",

    number: (e) => {
      showControl();
      if (hideControls) return;
      numberChangeChannel(e.key);
    },

    fast_prev: () => {
      showControl();
      if (hideControls) return;
      setShowPreviewImages(true);
    },

    fast_next: () => {
      showControl();
      if (hideControls) return;
      setShowPreviewImages(true);
    },

    prev: () => {
      showControl();
      if (hideControls) return;
      setShowPreviewImages(true);
    },

    next: () => {
      showControl();
      if (hideControls) return;
      setShowPreviewImages(true);
    },

    pause: () => {
      secCurrentTime.current = 0;
      if (isPaused) play();
      else pause();
    },

    play: () => {
      secCurrentTime.current = 0;
      if (isPaused) play();
      else pause();
    },

    left: () => {
      showControl();
      if (hideControls) return;
      // if (active === 0) return;

      // setActive(active - 1);
    },

    right: () => {
      showControl();
      if (hideControls) return;
      setActive(1);
      // if (active === 1) return;
      // setActive(active + 1);
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
        dispatch(setIsCategoriesOpen(true));
        setPipMode(true);
        window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
      } else if (active === 2) {
        secCurrentTime.current = 0;
        if (isPaused) play();
        else pause();
      } else if (active === 1 || active === 3) {
        // if (active === 1) {
        //   if (window.Android) {
        //     const currentTime = window.Android.getCurrentTime();
        //     const duration = window.Android.getVideoDuration();
        //     imitateTimeUpdate(currentTime, duration);
        //     seekToHandler("rewind");
        //   } else {
        //     seekToHandler("rewind");
        //   }
        // } else if (active === 3) {
        //   if (window.Android) {
        //     const currentTime = window.Android.getCurrentTime();
        //     const duration = window.Android.getVideoDuration();
        //     imitateTimeUpdate(currentTime, duration);
        //   }
        //   seekToHandler("forward");
        // }

        return;
      } else if (active === 4) {
        setActive(0);
        if (currentChannel) {
          getChannelInfo(currentChannel.id);
        }
        dispatch(setPlayerType("live"));
      }
    },
  });

  useEffect(() => {
    return () => {
      if (channelChangeTimeout.current) {
        clearTimeout(channelChangeTimeout.current);
      }
    };
  }, []);

  const remainingTime = !window.Android
    ? (cTime / (refVideo.current ? refVideo.current.duration : 0)) * 100
    : (window.Android.getCurrentTime() / window.Android.getVideoDuration()) *
      100;
  return (
    <>
      {number || displayChannel ? (
        <p className="num-change-channel">{number || displayChannel}</p>
      ) : null}
      <div
        className={`live-control${hideControls ? " hide" : ""}${showPreviewImages ? " preview" : ""}`}
      >
        <InfoLiveControl
          playerType={playerType}
          currentChannel={currentChannel}
          active={active}
        />
        <div className="progress-field">
          {playerType === "live" ? (
            // <Progress
            //   playerType={playerType}
            //   color="#FFFFFF"
            //   refProgress={refProgress}
            //   refVal={refVal}
            //   duration={secDuration}
            //   currentTime={currentTimeSeekto.current}
            //   onSeekTo={seekToHandler}
            //   seekByClick={seekByClick}
            // />
            <InoPlayerProgress
              isActive={false}
              value={remainingTime}
              duration={duration}
              showTime={false}
              // onChange={(value) => {
              //   changeCTime((value * refVideo.current.duration) / 100);
              // }}
              showTooltip={false}
              isLive={true}
            />
          ) : (
            <>
              <InoPlayerProgress
                isActive={false}
                value={remainingTime}
                duration={duration}
                showTime={true}
                onChange={(value) => {
                  changeCTime((value * refVideo.current.duration) / 100);
                }}
                showTooltip={false}
              />
            </>
          )}

          {playerType === "live" ? (
            <>
              <LiveIcon type={playerType} />
            </>
          ) : playerType === "timeshift" ? (
            <>
              <ArchiveButtons
                play={play}
                pause={pause}
                type={playerType}
                active={active}
                setActive={() => setActive(0)}
                actionHandler={(index) => {
                  handleArchiveAction(index);
                }}
                onLiveHandler={() => {
                  dispatch(setPlayerType("live"));
                  setUrl(refUrlLive.current.url);
                }}
              />
              {/* <LiveIcon type={playerType} isActive={active === 4} /> */}
              {/* <Duration
                _ref={currentTimeRef}
                className={"timeshift-duration"}
              /> */}
            </>
          ) : (
            <>
              <ArchiveButtons
                play={play}
                pause={pause}
                type={playerType}
                active={active}
                setActive={() => setActive(0)}
                actionHandler={(index) => {
                  handleArchiveAction(index);
                }}
                onLiveHandler={() => {
                  dispatch(setPlayerType("live"));
                  setUrl(refUrlLive.current.url);
                }}
              />
              <LiveIcon type={playerType} isActive={active === 4} />
              {/* <Duration _ref={durationRef} className={"archive-duration"} /> */}
              {/* <Duration
                _ref={currentTimeRef}
                className={"archive-current_time"}
              /> */}
            </>
          )}
        </div>
        {playerType === "live" ? (
          <div className={"live-fav_wrapper"}>
            <p className={`live-fav_text ${active === 2 ? "active" : ""}`}>
              Favorite
            </p>
            {currentChannel?.favorite ? (
              <img
                src={favFill}
                className="live-fav_icon"
                onClick={() => toggleFavorite(false)}
              />
            ) : (
              <img
                src={favImg}
                className="live-fav_icon"
                onClick={() => toggleFavorite(true)}
              />
            )}
          </div>
        ) : null}
      </div>
    </>
  );
});
