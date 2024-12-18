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
import {
  selectNextArchive,
  selectShowPreviewImages,
} from "@app/player/playerSlice";

import { getChannels, channelInfo } from "@server/requests";

import useKeydown from "@hooks/useKeydown";
import LOCAL_STORAGE from "@utils/localStorage";
import PATH from "@utils/paths";

import Player from "@components/player/Player.jsx";
import PipModeLive from "@components/live/PipModeLive.jsx";

import "@styles/components/livePage.scss";
import { setUrlArchive } from "@utils/util";
import { InoProtectInput, Modal, toast } from "@ino-ui/tv";
import { selectCtrl, setCtrl } from "@app/global";

export default function LivePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const ctrl = useSelector(selectCtrl);

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const nextArchive = useSelector(selectNextArchive);

  const [pipMode, setPipMode] = useState(false);
  const [url, setUrl] = useState(null);
  const [retryC, setRetryC] = useState(1);
  const [isShowProtected, setIsShowProtected] = useState(false);

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

    if (window.Android) {
      document.body.classList.add("playing");
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
      if (currentChannel.is_protected) {
        setIsShowProtected(true);
        dispatch(setCtrl("protected"));
      } else {
        setUrl(currentChannel.url);
      }
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

      if (message.is_protected) {
        setIsShowProtected(true);
        dispatch(setCtrl("protected"));
      } else {
        setUrl(_url);
      }
    }
  };

  const endedArchive = () => {
    if (refUrlLive.current) {
      setUrl(refUrlLive.current);
      dispatch(setPlayerType("live"));
    }
  };

  useKeydown({
    isActive: !pipMode && !showPreviewImages && ctrl !== "protected",
    back: () => {
      document.body.classList.remove("playing");
      window.PLAYER.destroyPlayer();
      // navigate(PATH.MENU);
    },
  });

  const handleNextArchive = () => {
    if (nextArchive) {
      const url = setUrlArchive(nextArchive, currentChannel);
      setUrl(url);
    } else {
      endedArchive();
    }
  };

  const localParentalCode = localStorage.getItem("parental_code");
  const parentalCode = localParentalCode ? JSON.parse(localParentalCode) : null;

  return (
    <div className={`parent-live-page${pipMode ? " pip-mode" : ""}`}>
      <Modal
        isOpen={isShowProtected}
        onClose={() => {
          setIsShowProtected(false);
          dispatch(setCtrl(""));
        }}
        onCancel={() => {}}
        onOk={() => {}}
        size="full"
      >
        <InoProtectInput
          isActive={ctrl === "protected"}
          count={4}
          isOpenKeyboard={true}
          onChange={(value) => {}}
          onComplete={(value) => {
            if (value === parentalCode) {
              setIsShowProtected(false);
              setUrl(currentChannel.url);
              dispatch(setCtrl(""));
            } else {
              toast.error("Invalid parental code");
            }
          }}
          clearOnComplete={true}
        />
      </Modal>
      <Player
        type="live"
        url={url}
        pipMode={pipMode}
        setPipMode={setPipMode}
        setUrl={setUrl}
        refUrlLive={refUrlLive}
        endedArchive={endedArchive}
        retryC={retryC}
        setRetryC={setRetryC}
        onNextArchive={handleNextArchive}
        showProtected={() => {
          setIsShowProtected(true);
          dispatch(setCtrl("protected"));
        }}
      />
      {pipMode ? (
        <PipModeLive
          url={url}
          pipMode={pipMode}
          refUrlLive={refUrlLive}
          setUrl={setUrl}
          setPipMode={setPipMode}
        />
      ) : null}
    </div>
  );
}
