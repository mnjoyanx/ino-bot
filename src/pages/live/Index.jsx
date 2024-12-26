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

import { getChannels, channelInfo, getLiveFavorite } from "@server/requests";

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

  const customKeyboard = [
    [
      { label: 1, value: 1 },
      { label: 2, value: 2 },
      { label: 3, value: 3 },
    ],
    [
      { label: 4, value: 4 },
      { label: 5, value: 5 },
      { label: 6, value: 6 },
    ],
    [
      { label: 7, value: 7 },
      { label: 8, value: 8 },
      { label: 9, value: 9 },
    ],
    [
      { label: 0, value: "0" },
      {
        label: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            width="24"
            height="24"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <path
                d="M12.0004 9.5L17.0004 14.5M17.0004 9.5L12.0004 14.5M4.50823 13.9546L7.43966 17.7546C7.79218 18.2115 7.96843 18.44 8.18975 18.6047C8.38579 18.7505 8.6069 18.8592 8.84212 18.9253C9.10766 19 9.39623 19 9.97336 19H17.8004C18.9205 19 19.4806 19 19.9084 18.782C20.2847 18.5903 20.5907 18.2843 20.7824 17.908C21.0004 17.4802 21.0004 16.9201 21.0004 15.8V8.2C21.0004 7.0799 21.0004 6.51984 20.7824 6.09202C20.5907 5.71569 20.2847 5.40973 19.9084 5.21799C19.4806 5 18.9205 5 17.8004 5H9.97336C9.39623 5 9.10766 5 8.84212 5.07467C8.6069 5.14081 8.38579 5.2495 8.18975 5.39534C7.96843 5.55998 7.79218 5.78846 7.43966 6.24543L4.50823 10.0454C3.96863 10.7449 3.69883 11.0947 3.59505 11.4804C3.50347 11.8207 3.50347 12.1793 3.59505 12.5196C3.69883 12.9053 3.96863 13.2551 4.50823 13.9546Z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>{" "}
            </g>
          </svg>
        ),
        value: "delete",
        action: "delete",
        width: 14.5,
      },
    ],
  ];

  const ctrl = useSelector(selectCtrl);

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const showPreviewImages = useSelector(selectShowPreviewImages);
  const nextArchive = useSelector(selectNextArchive);

  const [pipMode, setPipMode] = useState(false);
  const [url, setUrl] = useState(null);
  const [retryC, setRetryC] = useState(1);
  const [isShowProtected, setIsShowProtected] = useState(false);
  const [clickedChannelId, setClickedChannelId] = useState(null);
  const refUrlLive = useRef(null);

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

  const getAllFavoritesHadnler = async () => {
    try {
      const res = await getLiveFavorite();
      const parsedRes = JSON.parse(res);
      if (!parsedRes.error) {
        return parsedRes.message.rows;
      }

      return [];
    } catch (err) {
      console.log(err);
    }
  };

  const getAllChannels = async () => {
    const response = await getChannels({
      query: JSON.stringify({ pagination: false, sort: ["position", "ASC"] }),
    });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
      if (message === "Forbidden") navigate("/");
    } else {
      const favs = await getAllFavoritesHadnler();
      const _message = message.map((item) => {
        item.is_favorite = favs.some(
          (fav) => fav.favorite.channelId === item.id
        );
        return item;
      });
      dispatch(setAllChannels(_message));
      getFirstChannel(_message);
    }
  };

  const findNextNotProtectedChannel = (array) => {
    const currentIndex = currentChannel
      ? array.findIndex((item) => item.id === currentChannel.id)
      : -1;

    const startIndex = currentIndex === -1 ? 0 : currentIndex;

    for (let i = startIndex; i < array.length; i++) {
      if (!array[i].is_protected) {
        console.log("Found next non-protected channel:", array[i]);
        setUrl(array[i].url);
        dispatch(setCurrentChannel(array[i]));
        return;
      }
    }

    for (let i = startIndex - 1; i >= 0; i--) {
      if (!array[i].is_protected) {
        console.log("Found previous non-protected channel:", array[i]);
        setUrl(array[i].url);
        dispatch(setCurrentChannel(array[i]));
        return;
      }
    }

    const anyNonProtected = array.find((item) => !item.is_protected);
    if (anyNonProtected) {
      console.log("Found any non-protected channel:", anyNonProtected);
      setUrl(anyNonProtected.url);
      dispatch(setCurrentChannel(anyNonProtected));
    }
  };

  const getFirstChannel = (array) => {
    if (currentChannel) {
      console.log("currentChannel", currentChannel);
      if (currentChannel.is_protected) {
        findNextNotProtectedChannel(array);
      } else {
        setUrl(currentChannel.url);
      }
    } else {
      let channel_id = array[0]?.id;

      console.log(
        "channel_id",
        channel_id,
        "----",
        LOCAL_STORAGE.LAST_CHANNEL_ID.GET()
      );
      if (LOCAL_STORAGE.LAST_CHANNEL_ID.GET()) {
        channel_id = LOCAL_STORAGE.LAST_CHANNEL_ID.GET();
        const savedChannel = array.find((ch) => ch.id === channel_id);
        if (savedChannel?.is_protected) {
          findNextNotProtectedChannel(array);
          return;
        }
      } else {
        const firstNonProtected = array.find((ch) => !ch.is_protected);
        if (firstNonProtected) {
          channel_id = firstNonProtected.id;
          LOCAL_STORAGE.LAST_CHANNEL_ID.SET(channel_id);
        }
      }
      getChannelInfo(channel_id);
    }
  };

  const getChannelInfo = async (id, showProtected = true) => {
    console.log("getChannelInfo");
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

      if (message.is_protected && showProtected && !allChannels.length) {
        findNextNotProtectedChannel(allChannels);
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

  const handleShowProtected = (id) => {
    setIsShowProtected(true);
    setClickedChannelId(id);
  };

  useKeydown({
    isActive: !pipMode && !showPreviewImages && ctrl !== "protected",
  });

  const handleNextArchive = () => {
    if (nextArchive) {
      const url = setUrlArchive(nextArchive, currentChannel);
      setUrl(url);
    } else {
      endedArchive();
    }
  };

  useEffect(() => {
    return () => {
      setPipMode(false);
      window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
    };
  }, []);

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
        classNames="ino-modal_parent"
        size="full"
      >
        <InoProtectInput
          isActive={ctrl === "protected"}
          count={4}
          isOpenKeyboard={true}
          isAsterisk={true}
          customType={customKeyboard}
          onChange={(value) => {}}
          onComplete={(value) => {
            if (value === parentalCode) {
              setIsShowProtected(false);
              setUrl(currentChannel.url);
              dispatch(setCtrl(""));

              if (pipMode) {
                getChannelInfo(clickedChannelId, false);
                dispatch(setPlayerType("live"));
                setPipMode(false);
                window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
              }
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
          setIsShowProtected={handleShowProtected}
        />
      ) : null}
    </div>
  );
}
