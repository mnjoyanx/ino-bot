import { memo, useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectChannels,
  selectCurrentChannel,
  setCurrentChannel,
  playerType,
  setPlayerType,
} from "@app/channels/channelsSlice";

import { channelInfo } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

import useKeydown from "@hooks/useKeydown";

import CardChannel from "./CardChannel";
import ArrowButton from "../../common/ArrowButton";

import "../styles/ChannelsWrapper.scss";

export default memo(function ChannelsWrapper({
  control,
  selectedCategory,
  setControl,
  setUrl,
  setPipMode,
  refSetIndex,
}) {
  const dispatch = useDispatch();

  const categories = useSelector(selectChannels);
  const currentChannel = useSelector(selectCurrentChannel);

  const [active, setActive] = useState(0);
  const [start, setStart] = useState(0);

  const handleClick = useCallback(
    (index, id) => {
      getChannelInfo(id);
      dispatch(setPlayerType("live"));
    },
    [currentChannel]
  );

  const handleUp = () => {
    if (active === 0) {
      setControl("search");

      return;
    }

    setActive(active - 1);
    if (active - 1 > 2 && active - 1 < categories[selectedCategory]?.total - 4)
      setStart(start - 1);
  };

  const handleDown = () => {
    if (active === categories[selectedCategory]?.total - 1) return;

    setActive(active + 1);
    if (active > 2 && active < categories[selectedCategory]?.total - 4)
      setStart(start + 1);
  };

  const getChannelInfo = async (id) => {
    if (id === currentChannel?.id) {
      setPipMode(false);
      window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
      return;
    }
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
      setUrl(_url);
    }
  };

  useEffect(() => {
    if (currentChannel || selectedCategory === "All") {
      for (var i = 0; i < categories[selectedCategory]?.content?.length; i++) {
        if (
          categories[selectedCategory]?.content[i].id === currentChannel?.id
        ) {
          setActive(i);
          if (i > 2 && i < categories[selectedCategory]?.total - 4) setStart(i);
          else if (i > categories[selectedCategory]?.total - 4) {
            setStart(categories[selectedCategory]?.total - 7);
          }
          break;
        }
      }
    }
  }, [categories, currentChannel]);

  useEffect(() => {
    if (refSetIndex.current) {
      setActive(0);
      setStart(0);
    }
  }, [selectedCategory]);

  useKeydown({
    isActive: control,

    up: handleUp,

    down: handleDown,

    left: () => setControl("category"),

    right: () => setControl("epg"),

    ok: () => {
      handleClick("", categories[selectedCategory].content[active].id);
    },
  });

  return (
    <div className="parent-channels">
      <h3 className="title">Channels</h3>
      <div className="channels-wrapper">
        {active > 0 && categories[selectedCategory]?.content?.length > 12 ? (
          <ArrowButton onClick={handleUp} type="up" />
        ) : null}
        <div className="list-channels">
          {categories[selectedCategory]?.content?.map((elem, index) => {
            return index >= start && index < start + 12 ? (
              <CardChannel
                key={elem.id}
                isActive={active === index && control}
                elem={elem}
                onClick={handleClick}
              />
            ) : null;
          })}
        </div>
        {categories[selectedCategory]?.content?.length > 12 &&
        active != categories[selectedCategory]?.content?.length - 1 ? (
          <ArrowButton onClick={handleDown} type="down" />
        ) : null}
      </div>
    </div>
  );
});
