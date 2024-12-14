import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setPlayerType,
  selectCurrentChannel,
  selectPlayerType,
} from "@app/channels/channelsSlice";
import { getEpgList } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";
import { useTranslation } from "react-i18next";
import useKeydown from "@hooks/useKeydown";

import CardEpg from "./CardEpg";

import "../styles/EpgListWrapper.scss";
import ArrowButton from "../../common/ArrowButton";
import { setArchives, setCurrentArchive } from "@app/player/playerSlice";
import { setUrlArchive } from "@utils/util";

export default memo(function EpgListWrapper({
  control,
  setControl,
  setPipMode,
  setUrl,
  url,
  refUrlLive,
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);

  const [emptyList, setEmptyList] = useState(false);
  const [epgList, setEpgList] = useState([]);

  const [active, setActive] = useState(0);
  const [start, setStart] = useState(0);
  const [currentEpgIndex, setCurrentEpgIndex] = useState(null);

  const currnetDate = useRef(new Date().getTime());

  useEffect(() => {
    if (currentChannel) {
      reqGetEpgList();
    }
  }, [currentChannel]);

  const reqGetEpgList = async () => {
    const res = await getEpgList({
      date: "-1,1",
      id: currentChannel.id_epg,
    });
    const parsedRes = JSON.parse(res);
    const { message, error } = parsedRes;

    if (error) {
      setEmptyList(true);
    } else if (message.length === 0) {
      setEmptyList(true);
    } else {
      const currentEpgIndex = message.findIndex(
        (e) =>
          e.start_ut * 1000 < currnetDate.current &&
          e.stop_ut * 1000 > currnetDate.current,
      );

      if (currentEpgIndex !== -1) {
        setCurrentEpgIndex(currentEpgIndex);
        setActive(currentEpgIndex);
        if (currentEpgIndex !== 0) setStart(currentEpgIndex - 1);
      }

      setEpgList([...message]);
      dispatch(setArchives([...message]));
    }
  };

  const handleUp = () => {
    if (active === 0) return;

    setActive(active - 1);
    if (active - 1 > 0 && active - 1 < epgList.length - 2) setStart(start - 1);
  };

  const handleDown = () => {
    if (active === epgList.length - 1) return;

    setActive(active + 1);
    if (active > 0 && active < epgList.length - 2) setStart(start + 1);
  };

  const handleClickEpg = useCallback(
    (item) => {
      let type =
        item.start_ut * 1000 < currnetDate.current &&
        item.stop_ut * 1000 > currnetDate.current
          ? "now"
          : currnetDate.current < item.start_ut * 1000
            ? "future"
            : "past";

      if (type == "past" && currentChannel?.has_archive) {
        if (currentChannel?.archived_channel?.archiver) {
          const url = setUrlArchive(item, currentChannel);
          setUrl(url);
        }
        // setUrlArchive(item);
        dispatch(setCurrentArchive(item));
        if (playerType === "live") refUrlLive.current = url;
        dispatch(setPlayerType("archive"));
        setPipMode(false);
        window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
      }
    },
    [currentChannel],
  );

  // const setUrlArchive = (item) => {
  //   const { start_ut, stop_ut } = item;

  //   if (currentChannel?.archived_channel?.archiver) {
  //     let __host = "";
  //     let _url = "";
  //     let ip = currentChannel.archived_channel.archiver.ip;

  //     if (ip.indexOf("http") == -1) ip = "http://" + ip;

  //     if (ip.indexOf("https") > -1) __host = ip;
  //     else __host = ip + ":" + currentChannel.archived_channel.archiver.port;

  //     _url =
  //       __host +
  //       "/archive/" +
  //       currentChannel.archived_channel.channelId +
  //       "/index.m3u8" +
  //       "?start=" +
  //       start_ut +
  //       "&duration=" +
  //       (stop_ut - start_ut);

  //     setUrl(_url);
  //   }
  // };

  useKeydown({
    isActive: control,

    up: handleUp,

    down: handleDown,

    left: () => setControl("channel"),

    ok: () => {
      handleClickEpg(epgList[active]);
    },
  });

  return (
    <div className="parent-epg_list">
      <img
        className="logo-currnet_channel"
        src={currentChannel?.image}
        alt=""
        onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
      />

      {playerType !== "live" ? (
        <div className="rec_video">{t("REC")}</div>
      ) : null}

      <div className="epg-list-wrapper">
        {!emptyList && active !== 0 ? (
          <ArrowButton onClick={handleUp} type="up" />
        ) : null}

        {emptyList ? (
          <p className="empty">{t("List is empty")}</p>
        ) : (
          <div
            className="main-epg_list"
            onWheel={(e) => {
              if (e.deltaY < 0) handleUp();
              else handleDown();
            }}
          >
            {epgList.map((item, index) => {
              let type =
                item.start_ut * 1000 < currnetDate.current &&
                item.stop_ut * 1000 > currnetDate.current
                  ? "now"
                  : currnetDate.current < item.start_ut * 1000
                    ? "future"
                    : "past";

              return index >= start && index < start + 3 ? (
                <CardEpg
                  key={item.start}
                  item={item}
                  currentEpg={currentEpgIndex == index}
                  nextEpg={currentEpgIndex + 1 == index}
                  isActive={index === active && control}
                  type={type}
                  hasArchive={currentChannel?.has_archive}
                  onClick={handleClickEpg}
                />
              ) : null;
            })}
          </div>
        )}
        {!emptyList && active !== epgList.length - 1 ? (
          <ArrowButton onClick={handleDown} type="down" />
        ) : null}
      </div>
    </div>
  );
});
