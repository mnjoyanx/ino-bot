import { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectChannels } from "@app/channels/channelsSlice";

import CardCategory from "./CardCategory";

import "../styles/CategoriesWrapper.scss";

export default memo(function CategoriesWrapper({ control, setCategory }) {
  const categories = useSelector(selectChannels);

  const [active, setActive] = useState(0);
  

  const handleClick = useCallback((name) => {
    setCategory(name);
  }, []);

  return (
    <div className="parent-categories">
      <h3 className="title">Categories</h3>
      <div className="categories-wrapper">
        <div className="list-category">
          {Object.keys(categories).map((e, i) => {
            const elem = categories[e];

            return (
              <CardCategory
                key={elem.id}
                isActive={active === i}
                total={elem.total}
                name={elem.name}
                index={i}
                onClick={handleClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
