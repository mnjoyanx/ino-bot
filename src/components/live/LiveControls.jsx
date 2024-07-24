import { memo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentChannel,
  selectPlayerType,
  selectAllChannels,
  setCurrentChannel,
} from "@app/channels/channelsSlice";
import { channelInfo } from "@server/requests";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import Duration from "../player/components/Duration";
import Progress from "../player/components/Progress";
import LiveIcon from "./components/LiveIcon";

import SvgArrow from "../../assets/images/live/SvgArrow";

import "./styles/LiveControl.scss";

export default memo(function LiveControls({ durationRef, setUrl }) {
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);

  const findChannel = () => {
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

  useEffect(() => {
    findChannel();
  }, [currentChannel]);

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

  useKeydown({
    isActive: true,

    up: () => {
      if (refNextChannel.current) {
        getChannelInfo(refNextChannel.current.id);
      }
    },

    down: () => {
      if (refPrevChannel.current) {
        getChannelInfo(refPrevChannel.current.id);
      }
    },
  });

  return (
    <div className="live-control">
      <div className="parent-number-channel">
        <span className="arrow arrow-up">
          <SvgArrow />
        </span>
        <p className="number-channel">{currentChannel?.position}</p>
        <span className="arrow arrow-down">
          <SvgArrow />
        </span>
      </div>
      <div className="logo">
        <img
          src={currentChannel?.image}
          onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
          alt=""
        />
      </div>
      <div className="name-channel">
        <p>{currentChannel?.name}</p>
      </div>
      <div className="progress-field">
        <Progress percent={playerType === "live" ? 100 : 0} color="#FFFFFF" />
        {playerType === "live" ? (
          <LiveIcon />
        ) : (
          <Duration durationRef={durationRef} />
        )}
      </div>
    </div>
  );
});
