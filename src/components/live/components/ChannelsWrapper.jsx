import { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectChannels } from "@app/channels/channelsSlice";

import CardChannel from "./CardChannel";

import "../styles/ChannelsWrapper.scss";

export default memo(function ChannelsWrapper({ control, selectedCategory }) {
  const categories = useSelector(selectChannels);

  const [active, setActive] = useState(0);

  const handleClick = useCallback((elem) => {}, []);

  return (
    <div className="parent-channels">
      <h3 className="title">Channels</h3>
      <div className="channels-wrapper">
        <div className="list-channels">
          {categories[selectedCategory]?.content?.map((elem, index) => {
            return index < 10 ? (
              <CardChannel
                key={elem.id}
                isActive={active === index}
                elem={elem}
                onClick={handleClick}
              />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
});
