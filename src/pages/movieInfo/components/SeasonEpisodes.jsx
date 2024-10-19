import React, { useState, useEffect, useCallback } from "react";
import styles from "@styles/components/seasonEpisodes.module.scss";
import useKeydown from "@hooks/useKeydown";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import EpisodeCard from "./EpisodeCard";
import ListView from "ino-listview";
import { useSeasonEpisodeActions } from "../hooks/useSeasonEpisodeActions";

const SeasonEpisodes = ({
  episodes,
  activeSeason,
  setActiveSeason,
  seasonsLength,
  seriesId,
  setUrl,
}) => {
  const [activeEpisode, setActiveEpisode] = useState(0);
  const ctrl = useSelector(selectCtrl);
  const dispatch = useDispatch();

  const { handleEpisodeClick, handleSeasonChange } = useSeasonEpisodeActions(
    seriesId,
    setUrl
  );

  useKeydown({
    isActive: ctrl === "episodes",
    up: () => {
      dispatch(setCtrl("seasons"));
    },
    left: () => setActiveSeason((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveSeason((prev) => Math.min(seasonsLength - 1, prev + 1)),
    ok: () => {
      console.log(episodes, "epeepe", episodes[activeEpisode]);
      if (episodes[activeEpisode]) {
        handleEpisodeClick(episodes[activeEpisode].id);
      }
    },
  });

  useEffect(() => {
    setActiveEpisode(0);
    handleSeasonChange(activeSeason);
  }, [activeSeason, handleSeasonChange]);

  const renderEpisodeCard = useCallback(
    ({ index, style, isActive, item }) => (
      <EpisodeCard
        key={item.id}
        episode={item}
        index={index}
        isActive={isActive}
        style={style}
        onClick={() => handleEpisodeClick(item.id)}
      />
    ),
    [handleEpisodeClick]
  );

  return (
    <div className={styles["episodes-container"]}>
      <h3>Episodes</h3>
      <ListView
        id="episodes_list"
        uniqueKey={`episodes-season-${activeSeason}-list`}
        itemsTotal={episodes.length}
        itemsCount={5}
        listType="horizontal"
        itemWidth={20}
        itemHeight={15}
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
