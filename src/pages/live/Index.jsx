import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllChannels,
  selectChannels,
  selectCurrentChannel,
  setChannels,
  setAllChannels,
  setCurrentChannel,
} from "@app/channels/channelsSlice";
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

  const [pipMode, setPipMode] = useState(false);
  const [url, setUrl] = useState(null);

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
      dispatch(setCurrentChannel(message));
      setUrl(message.url);
    }
  };

  useKeydown({
    isActive: !pipMode,
    back: () => navigate(PATH.MENU),
  });

  return (
    <div className={`parent-live-page${pipMode ? " pip-mode" : ""}`}>
      <Player
        type="live"
        url={url}
        pipMode={pipMode}
        setPipMode={setPipMode}
        setUrl={setUrl}
      />
      {pipMode ? <PipModeLive setUrl={setUrl} setPipMode={setPipMode} /> : null}
    </div>
  );
}
