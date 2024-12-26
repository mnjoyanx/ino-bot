import { memo, useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChannel,
  selectPlayerType,
  selectAllChannels,
  setCurrentChannel,
  setPlayerType,
  selectChannels,
  setChannels,
  selectSelectedCategory,
} from "@app/channels/channelsSlice";
import { useTranslation } from "react-i18next";
import {
  setShowPreviewImages,
  selectShowPreviewImages,
  selectIsPaused,
  selectCurrentArchive,
} from "@app/player/playerSlice";
import { channelInfo } from "@server/requests";
import { formatDate, formatTime } from "@utils/util";
import {
  selectCtrl,
  setIsCategoriesOpen,
  setLastActiveIndex,
} from "@app/global";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import LiveIcon from "./components/LiveIcon";
import InfoLiveControl from "./components/InfoLiveControl";
import ArchiveButtons from "./components/ArchiveButtons";
import FavActiveSvg from "@assets/icons/FavActiveSvg";
import SvgBackward from "@assets/images/live/backward";

import "./styles/LiveControl.scss";
import { addLiveFavorite, removeLiveFavorite } from "../../server/requests";
import { InoButton, InoPlayerProgress } from "@ino-ui/tv";

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
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const isPaused = useSelector(selectIsPaused);
  const ctrl = useSelector(selectCtrl);
  const categoryChannels = useSelector(selectChannels);
  const selectedCategory = useSelector(selectSelectedCategory);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);
  const timeOutNumber = useRef(null);
  const refVal = useRef(null);

  const currentTimeSeekto = useRef(0);

  const [number, setNumber] = useState("");
  const [active, setActive] = useState(0);
  const [hideControls, setHideControls] = useState(false);
  const [time, setTime] = useState(new Date().getTime());

  const channelChangeTimeout = useRef(null);

  const [displayChannel, setDisplayChannel] = useState(null);

  const currentArchive = useSelector(selectCurrentArchive);

  const findChannel = () => {
    if (allChannels.length <= 1) return;
    for (let i = 0; i < allChannels.length; i++) {
      if (allChannels[i].id === currentChannel.id) {
        let nextIdx = i;
        do {
          nextIdx = (nextIdx + 1) % allChannels.length;
        } while (nextIdx !== i && allChannels[nextIdx].is_protected);

        if (nextIdx !== i) {
          refNextChannel.current = allChannels[nextIdx];
        }

        let prevIdx = i;
        do {
          prevIdx = prevIdx === 0 ? allChannels.length - 1 : prevIdx - 1;
        } while (prevIdx !== i && allChannels[prevIdx].is_protected);

        if (prevIdx !== i) {
          refPrevChannel.current = allChannels[prevIdx];
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

      if (!message?.id_protected) {
        LOCAL_STORAGE.LAST_CHANNEL_ID.SET(id);
      }
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

      if (timeOutNumber.current) {
        clearTimeout(timeOutNumber.current);
      }

      timeOutNumber.current = setTimeout(() => {
        findChannelByNumber(_number);
        setNumber("");
      }, 1000);
    }
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
          JSON.stringify(categoryChannels)
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
          JSON.stringify(categoryChannels)
        );

        if (categoryChannelsClone && categoryChannelsClone.favorites) {
          const filteredCatChannels =
            categoryChannelsClone.favorites.content.filter(
              (channel) => channel.id !== currentChannel.id
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
    const interval = setInterval(() => {
      setTime(new Date().getTime());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const findCurrentIndex = useCallback(() => {
    return categoryChannels[selectedCategory]?.content?.findIndex((item) => {
      return item.id === currentChannel?.id;
    });
  }, [categoryChannels, selectedCategory, currentChannel]);

  useKeydown({
    isActive: showPreviewImages && ctrl !== "protected",

    back: () => {
      if (!window.Android) {
        if (!isPaused) refVideo.current.play();
      } else {
        // window.Android.play();
      }
      dispatch(setShowPreviewImages(false));
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

    up: () => {
      showControl();
      if (hideControls) return;
      if (number) {
        // Clear both the number and the timeout
        if (timeOutNumber.current) {
          clearTimeout(timeOutNumber.current);
        }
        setNumber("");
        return;
      }
      nextChannel();
    },

    down: () => {
      showControl();
      if (hideControls) return;
      if (number) {
        if (timeOutNumber.current) {
          clearTimeout(timeOutNumber.current);
        }
        setNumber("");
        return;
      }
      prevChannel();
    },

    back: () => {
      const currentIndex = findCurrentIndex();
      dispatch(setLastActiveIndex(currentIndex));

      if (number) {
        if (timeOutNumber.current) {
          clearTimeout(timeOutNumber.current);
        }
        setNumber("");
        return;
      }
      dispatch(setIsCategoriesOpen(true));
      setPipMode(true);
      window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
    },

    ok: () => {
      showControl();
      if (hideControls) return;

      if (number) {
        findChannelByNumber(Number(number));
        setNumber("");
        return;
      }

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

    back: () => {
      showControl();
      if (hideControls) return;
      dispatch(setIsCategoriesOpen(true));
      setPipMode(true);
      window.PLAYER.setPositionPlayer(720, 403, 1061, 224);
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

  // Clean up timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeOutNumber.current) {
        clearTimeout(timeOutNumber.current);
      }
    };
  }, []);

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
        <div className="progres-field">
          {playerType === "live" ? (
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
              <div>
                {playerType === "timeshift" ? (
                  <div className="timeshift-progress__time_current">
                    {formatDate(
                      new Date(time - duration * 1000 + cTime * 1000),
                      "hh:mm aaa"
                    )}
                  </div>
                ) : (
                  <div className={`progress__time_current ${playerType}`}>
                    {formatDate(
                      new Date((currentArchive?.start_ut + cTime) * 1000),
                      "hh:mm aaa"
                    )}
                  </div>
                )}
              </div>
              <div className="progress__time_current">
                {playerType === "timeshift" ? (
                  <>{formatDate(new Date(time), "hh:mm aaa")}</>
                ) : (
                  <>
                    {formatDate(
                      new Date(currentArchive?.stop_ut * 1000),
                      "hh:mm aaa"
                    )}
                  </>
                )}
              </div>
              <InoPlayerProgress
                isActive={false}
                value={remainingTime}
                duration={duration}
                showTime={false}
                onChange={(value) => {
                  changeCTime((value * refVideo.current.duration) / 100);
                }}
                showDuration={false}
                showLastTime={false}
                showTooltip={false}
                classNames={playerType}
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
                showControl={showControl}
                hideControls={hideControls}
                onLiveHandler={() => {
                  dispatch(setPlayerType("live"));
                  setUrl(refUrlLive.current?.url);
                }}
              />
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
                showControl={showControl}
                hideControls={hideControls}
                onLiveHandler={() => {
                  dispatch(setPlayerType("live"));
                  // setUrl(refUrlLive.current?.url);
                  // setUrl(currentChannel?.share_url);
                  const lastChannelId = LOCAL_STORAGE.LAST_CHANNEL_ID.GET();
                  getChannelInfo(lastChannelId);
                }}
              />
              <LiveIcon type={playerType} isActive={active === 4} />
            </>
          )}
        </div>
        {playerType === "live" ? (
          <div className="live-control_actions_wrapper">
            {/* <div
              className={`timeshift-btn`}
              style={{ opacity: currentChannel?.has_archive ? "1" : "0" }}
            > */}
            <InoButton
              size="small"
              classNames="timeshift-btn"
              isActive={active === 1}
            >
              <SvgBackward />
            </InoButton>
            {/* </div> */}
            <div className={"live-fav_wrapper"}>
              {currentChannel?.favorite ? (
                <InoButton
                  classNames="rounded-btn"
                  size="small"
                  isActive={active == 2}
                >
                  <FavActiveSvg
                    onClick={() => toggleFavorite(false)}
                    isFill={true}
                  />
                </InoButton>
              ) : (
                <InoButton
                  classNames="rounded-btn"
                  size="small"
                  isActive={active == 2}
                >
                  <FavActiveSvg
                    onClick={() => toggleFavorite(true)}
                    isFill={false}
                  />
                </InoButton>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
});
