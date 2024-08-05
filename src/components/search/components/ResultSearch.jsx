import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setCurrentChannel } from "@app/channels/channelsSlice";
import { channelInfo } from "@server/requests";
import { scrollElement } from "@utils/util";

import useKeydown from "@hooks/useKeydown";

import LOCAL_STORAGE from "@utils/localStorage";

import CardContnet from "../../cards/CardContnet";
import CardChannel from "../../cards/CardChannel";

export default memo(function ResultSearch({
  result,
  type,
  control,
  setShow,
  setUrl,
  refInp,
  setPipMode,
  empty,
}) {
  const dispatch = useDispatch();

  const refResult = useRef(null);

  const [active, setActive] = useState(0);

  useKeydown({
    isActive: control,

    back: () => setShow(false),

    up: () => {
      refInp.current.focus();
    },

    left: () => {
      if (active === 0) return;
      setActive(active - 1);
    },
    right: () => {
      if (active === result.length - 1) return;
      setActive(active + 1);
    },
    ok: () => {
      if (!empty) {
        selectChannel(result[active].id, active);
      } else {
        refInp.current.focus();
      }
    },
  });

  useEffect(() => {
    scrollElement(refResult.current, "X", active * -21 + "rem", 0);
  }, [active]);

  const selectChannel = async (id, index) => {
    const response = await channelInfo({ id: id });
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
    } else {
      LOCAL_STORAGE.LAST_CHANNEL_ID.SET(id);
      dispatch(setCurrentChannel(message));
      setUrl(message.url);
      setShow(false);
      setPipMode(false);
      window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
    }
  };

  return (
    <div className="parent-result">
      {empty ? (
        <div className="empty-result">
          <p>No result found</p>
        </div>
      ) : (
        <div className="main-result" ref={refResult}>
          {result.map((item, index) => {
            return type === "live" ? (
              <CardChannel
                key={item.id}
                item={item}
                isActive={index === active}
                onClick={selectChannel}
                index={index}
                className={
                  index >= active && index < active + 5 ? "visible" : "opacity"
                }
              />
            ) : (
              <CardContnet
                key={item.id}
                item={item}
                isActive={index === active}
                onClick={() => {}}
                className={
                  index >= active && index < active + 5 ? "visible" : "opacity"
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
