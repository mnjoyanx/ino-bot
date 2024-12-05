import { memo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectChannels,
  selectCurrentChannel,
  setCurrentChannel,
  setPlayerType,
  selectPlayerType,
} from "@app/channels/channelsSlice";
import { ListView } from "@ino-ui/tv";

import { channelInfo } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

import useKeydown from "@hooks/useKeydown";

import CardChannel from "./CardChannel";

import "../styles/ChannelsWrapper.scss";

export default memo(function ChannelsWrapper({
  control,
  selectedCategory,
  setControl,
  setUrl,
  setPipMode,
}) {
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const categories = useSelector(selectChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);

  const [active, setActive] = useState(0);

  const handleClick = useCallback(
    (index, id) => {
      getChannelInfo(id);
      dispatch(setPlayerType("live"));
    },
    [currentChannel, playerType],
  );

  const getChannelInfo = async (id) => {
    if (id === currentChannel?.id && playerType === "live") {
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

  useKeydown({
    isActive: control,

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
        <div className="list-channels">
          {categories[selectedCategory]?.content?.length > 0 ? (
            <ListView
              data={categories[selectedCategory]?.content}
              id="channels-list"
              uniqueKey="list-channels"
              listType="vertical"
              nativeControle={true}
              itemsCount={5}
              itemsTotal={categories[selectedCategory]?.content?.length}
              gap={0}
              buffer={10}
              itemWidth={31}
              itemHeight={7}
              isActive={control}
              initialActiveIndex={0}
              startScrollIndex={0}
              direction="ltr"
              onMouseEnter={() => {}}
              onUp={() => {
                setControl("search");
              }}
              onIndexChange={(index) => {
                setActive(index);
              }}
              renderItem={({ item, index, isActive, style }) => {
                return (
                  <CardChannel
                    key={item.id}
                    style={style}
                    isActive={isActive}
                    isSelected={item.id === currentChannel?.id}
                    elem={item}
                    index={index}
                    onClick={handleClick}
                  />
                );
              }}
            />
          ) : (
            <div className="empty-channel">
              <p className="empty-channel_text">No channels</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
