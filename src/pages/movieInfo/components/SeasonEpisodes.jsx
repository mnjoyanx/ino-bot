import React, { useState, useEffect, useCallback } from "react";
import styles from "@styles/components/seasonEpisodes.module.scss";
import useKeydown from "@hooks/useKeydown";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import EpisodeCard from "./EpisodeCard";
import ListView from "@components/lists/ListView";

const SeasonEpisodes = ({
  episodes,
  activeSeason,
  setActiveSeason,
  seasonsLength,
}) => {
  const [activeEpisode, setActiveEpisode] = useState(0);
  const ctrl = useSelector(selectCtrl);
  const dispatch = useDispatch();

  useKeydown({
    isActive: ctrl === "episodes",
    up: () => {
      dispatch(setCtrl("seasons"));
    },
    left: () => setActiveSeason((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveSeason((prev) => Math.min(seasonsLength - 1, prev + 1)),
  });

  useEffect(() => {
    setActiveEpisode(0);
  }, [activeSeason]);

  const renderEpisodeCard = useCallback(
    ({ index, style, isActive, item }) => (
      <EpisodeCard
        key={item.id}
        episode={item}
        index={index}
        isActive={isActive}
        style={style}
      />
    ),
    []
  );

  return (
    <div className={styles["episodes-container"]}>
      <h3>Episodes</h3>
      <ListView
        id="episodes_list"
        uniqueKey={`episodes-season-${activeSeason}-list`}
        itemsTotal={episodes.length}
        itemsCount={5} // Adjust based on how many episodes you want to show at once
        listType="horizontal"
        itemWidth={20} // Adjust based on your EpisodeCard width
        itemHeight={15} // Adjust based on your EpisodeCard height
        isActive={ctrl === "episodes"}
        activeCol={activeEpisode}
        buffer={2}
        debounce={100}
        nativeControle={true}
        renderItem={renderEpisodeCard}
        data={episodes}
        onBackScrollIndex={0}
        onUp={() => {
          dispatch(setCtrl("seasons"));
        }}
      />
    </div>
  );
};

export default SeasonEpisodes;
