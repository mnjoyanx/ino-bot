import { memo, useState, useRef, useEffect } from "react";

import { scrollElement } from "@utils/util";

import useKeydown from "@hooks/useKeydown";

import CardContnet from "../../cards/CardContnet";
import CardChannel from "../../cards/CardChannel";

export default memo(function ResultSearch({
  result,
  type,
  control,
  setShow,
  setControl,
  refInp,
}) {
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
  });

  useEffect(() => {
    scrollElement(refResult.current, "X", active * -21 + "rem", 0);
  }, [active]);

  return (
    <div className="parent-result">
      <div className="main-result" ref={refResult}>
        {result.map((item, index) => {
          return type === "live" ? (
            <CardChannel
              key={item.id}
              item={item}
              isActive={index === active}
              onClick={() => {}}
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
    </div>
  );
});
