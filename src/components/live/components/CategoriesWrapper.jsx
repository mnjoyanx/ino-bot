import { memo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectChannels } from "@app/channels/channelsSlice";
import useKeydown from "@hooks/useKeydown";
import { useTranslation } from "react-i18next";
import CardCategory from "./CardCategory";

import { ListView } from "@ino-ui/tv";

import "../styles/CategoriesWrapper.scss";

export default memo(function CategoriesWrapper({
  control,
  setCategory,
  setControl,
  category,
  refSetIndex,
}) {
  const { t } = useTranslation();
  const categories = useSelector(selectChannels);
  const [active, setActive] = useState(0);

  const handleClick = useCallback(
    (name) => {
      if (categories[name].total !== 0) {
        refSetIndex.current = true;
      }
      setCategory(name);
    },
    [category, control],
  );

  useKeydown({
    isActive: control,

    right: () => setControl("channel"),

    ok: () => {
      handleClick(categories[Object.keys(categories)[active]].name);
    },
  });

  return (
    <div className="parent-categories">
      <h3 className="title">{t("Categories")}</h3>
      <div className="categories-wrapper">
        <ListView
          data={Object.values(categories)}
          id="example-list"
          uniqueKey="list-"
          listType="vertical"
          nativeControle={true}
          itemsCount={5}
          itemsTotal={Object.keys(categories).length}
          gap={0}
          buffer={5}
          withTransition={false}
          itemWidth={25}
          itemHeight={7}
          isActive={control}
          initialActiveIndex={0}
          startScrollIndex={0}
          direction="ltr"
          onMouseEnter={() => {}}
          onIndexChange={(index) => {
            setActive(index);
          }}
          onUp={() => {
            setControl("search");
          }}
          renderItem={({ item, index, isActive, style }) => {
            return (
              <CardCategory
                key={item.id}
                style={style}
                isActive={isActive}
                isSelected={category === item.name}
                total={item.total}
                name={item.name}
                index={index}
                onClick={handleClick}
              />
            );
          }}
        />
      </div>
    </div>
  );
});
