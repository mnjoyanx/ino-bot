import { memo, useEffect, useRef, useState } from "react";
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

import "./styles/LiveControl.scss";
import InfoLiveControl from "./components/InfoLiveControl";

export default memo(function LiveControls({ durationRef, setUrl }) {
  const dispatch = useDispatch();

  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);
  const playerType = useSelector(selectPlayerType);

  const refNextChannel = useRef(null);
  const refPrevChannel = useRef(null);
  const timeOutNumber = useRef(null);

  const [number, setNumber] = useState("");

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

  useKeydown({
    isActive: true,

    number: (e) => {
      numberChangeChannel(e.key);
    },

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
    <>
      {number ? <p className="num-change-channel">{number}</p> : null}
      <div className="live-control">
        <InfoLiveControl currentChannel={currentChannel} />

        <div className="progress-field">
          <Progress percent={playerType === "live" ? 100 : 0} color="#FFFFFF" />
          {playerType === "live" ? (
            <LiveIcon />
          ) : (
            <Duration durationRef={durationRef} />
          )}
        </div>
      </div>
    </>
  );
});
