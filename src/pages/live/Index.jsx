import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllChannels,
  selectChannels,
  selectCurrentChannel,
  setAllChannels,
  setCurrentChannel,
  selectPlayerType,
  setPlayerType,
} from "@app/channels/channelsSlice";
import { selectShowPreviewImages } from "@app/player/playerSlice";
import { getChannels, channelInfo } from "@server/requests";

import useKeydown from "@hooks/useKeydown";
import LOCAL_STORAGE from "@utils/localStorage";
import PATH from "@utils/paths";

import Player from "@components/player/Player.jsx";
import PipModeLive from "@components/live/PipModeLive.jsx";

import "@styles/components/livePage.scss";

export default function LivePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const categoriesChannels = useSelector(selectChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const playerType = useSelector(selectPlayerType);

  const [pipMode, setPipMode] = useState(false);
  const [url, setUrl] = useState(null);

  const refUrlLive = useRef(null);

  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);

    if (allChannels.length === 0) {
      // localStorage.removeItem("TOKEN");
      getAllChannels();
    } else {
      getFirstChannel(allChannels);
    }
  }, []);

  const getAllChannels = async () => {
    const response = await getChannels({
      query: JSON.stringify({ pagination: false, sort: ["position", "ASC"] }),
    });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
      if (message === "Forbidden") navigate("/");
    } else {
      dispatch(setAllChannels(message));
      getFirstChannel(message);
    }
  };

  const getFirstChannel = (array) => {
    if (currentChannel) {
      setUrl(currentChannel.url);
    } else {
      let channel_id = array[0]?.id;

      if (LOCAL_STORAGE.LAST_CHANNEL_ID.GET()) {
        channel_id = LOCAL_STORAGE.LAST_CHANNEL_ID.GET();
      } else {
        LOCAL_STORAGE.LAST_CHANNEL_ID.SET(channel_id);
      }
      getChannelInfo(channel_id);
    }
  };

  const getChannelInfo = async (id) => {
    const response = await channelInfo({ id: id });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
      if (message === "Forbidden") navigate("/");
    } else {
      let _url = message.url;

      if (message.stream_type === "internal" && LOCAL_STORAGE.TOKEN.GET()) {
        _url += "?token=" + LOCAL_STORAGE.TOKEN.GET();
      }

      dispatch(setCurrentChannel(message));

      setUrl(_url);
    }
  };

  const endedArchive = () => {
    if (refUrlLive.current) {
      setUrl(refUrlLive.current);
      dispatch(setPlayerType("live"));
    }
  };

  useKeydown({
    isActive: !pipMode && !showPreviewImages,
    back: () => {
      window.PLAYER.destroyPlayer();
      navigate(PATH.MENU);
    },
  });

  return (
    <div className={`parent-live-page${pipMode ? " pip-mode" : ""}`}>
      <Player
        type="live"
        url={url}
        pipMode={pipMode}
        setPipMode={setPipMode}
        setUrl={setUrl}
        refUrlLive={refUrlLive}
        endedArchive={endedArchive}
      />
      {pipMode ? (
        <PipModeLive
          url={url}
          refUrlLive={refUrlLive}
          setUrl={setUrl}
          setPipMode={setPipMode}
        />
      ) : null}
    </div>
  );
}
