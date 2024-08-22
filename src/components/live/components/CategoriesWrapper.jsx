import { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectChannels } from "@app/channels/channelsSlice";

import useKeydown from "@hooks/useKeydown";

import CardCategory from "./CardCategory";

import "../styles/CategoriesWrapper.scss";
import ArrowButton from "../../common/ArrowButton";

export default memo(function CategoriesWrapper({
  control,
  setCategory,
  setControl,
  category,
  refSetIndex,
}) {
  const categories = useSelector(selectChannels);

  const [active, setActive] = useState(0);
  const [start, setStart] = useState(0);

  const handleClick = useCallback(
    (name) => {
      if (categories[name].total !== 0) {
        refSetIndex.current = true;
        setControl("channel");
      }
      setCategory(name);
    },
    [category, control]
  );

  const handleUp = () => {
    if (active === 0) {
      setControl("search");
      return;
    }

    setActive(active - 1);
    if (active - 1 > 4 && active - 1 < Object.keys(categories).length - 6)
      setStart(start - 1);
  };

  const handleDown = () => {
    if (active === Object.keys(categories).length - 1) return;

    setActive(active + 1);
    if (active > 4 && active < Object.keys(categories).length - 6)
      setStart(start + 1);
  };

  useKeydown({
    isActive: control,

    up: handleUp,

    down: handleDown,

    right: () => setControl("channel"),

    ok: () => {
      handleClick(categories[Object.keys(categories)[active]].name);
    },
  });

  return (
    <div className="parent-categories">
      <h3 className="title">Categories</h3>
      <div className="categories-wrapper">
        {active > 0 && Object.keys(categories).length > 12 ? (
          <ArrowButton onClick={handleUp} type="up" />
        ) : null}
        <div className="list-category">
          {Object.keys(categories).map((e, i) => {
            const elem = categories[e];

            return i >= start && i < start + 12 ? (
              <CardCategory
                key={elem.id}
                isActive={active === i && control}
                total={elem.total}
                name={elem.name}
                index={i}
                onClick={handleClick}
              />
            ) : null;
          })}
        </div>
        {Object.keys(categories).length > 12 &&
        active != Object.keys(categories).length - 1 ? (
          <ArrowButton onClick={handleDown} type="down" />
        ) : null}
      </div>
    </div>
  );
});
