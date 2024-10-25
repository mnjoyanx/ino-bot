import React, { useState, useEffect, useCallback } from "react";
import styles from "@styles/components/seasonEpisodes.module.scss";
import useKeydown from "@hooks/useKeydown";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import EpisodeCard from "./EpisodeCard";
import ListView from "ino-listview";
import { useSeasonEpisodeActions } from "../hooks/useSeasonEpisodeActions";
import { useMovieInfo } from "@context/movieInfoContext";
import { selectIsPlayerOpen } from "@app/global";

const SeasonEpisodes = ({
  allEpisodes,
  episodes,
  activeSeason,
  activeSeasonIndex,
  selectedSeason,
  changeSeason,
  seriesId,
  setUrl,
}) => {
  const {
    setStartTime,
    activeEpisode,
    setActiveEpisode,
    setIsLastEpisode,
    currentEpisode,
    setCurrentEpisode,
  } = useMovieInfo();
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const ctrl = useSelector(selectCtrl);
  const dispatch = useDispatch();

  // const [activeEpisode, setActiveEpisode] = useState(0);

  const { handleEpisodeClick, handleSeasonChange } = useSeasonEpisodeActions(
    seriesId,
    setUrl,
    episodes[activeEpisode]?.watched?.time || 0
  );

  useKeydown({
    isActive: ctrl === "episodes",
    up: () => {
      dispatch(setCtrl("seasons"));
    },
    left: () => setActiveEpisode((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveEpisode((prev) => Math.min(episodes.length - 1, prev + 1)),
    ok: () => {
      if (episodes[activeEpisode]) {
        setCurrentEpisode(episodes[activeEpisode]);
        setStartTime(episodes[activeEpisode]?.watched?.time || 0);
        handleEpisodeClick(episodes[activeEpisode].id);
      }
    },
  });

  const handleNextEpisode = () => {
    if (activeEpisode + 1 >= episodes.length) {
      changeSeason(activeSeasonIndex + 1);
      const nextEpisode = Object.values(allEpisodes)[activeSeasonIndex + 1][0];
      console.log(nextEpisode, "------ next episode");
      setCurrentEpisode(nextEpisode);
      setStartTime(0);
      setUrl("");
      handleEpisodeClick(nextEpisode.id);
      return;
    }

    setActiveEpisode((prev) => Math.min(episodes.length - 1, prev + 1));

    setCurrentEpisode(episodes[activeEpisode + 1]);

    const foundNextEpisode = episodes.find(
      (_episode, index) => index === activeEpisode + 1
    );

    if (foundNextEpisode) {
      setStartTime(foundNextEpisode?.watched?.time || 0);
      handleEpisodeClick(foundNextEpisode.id);
    }
  };

  useEffect(() => {
    document.addEventListener("next-episode", handleNextEpisode);
    return () =>
      document.removeEventListener("next-episode", handleNextEpisode);
  }, [handleNextEpisode]);

  useEffect(() => {
    setActiveEpisode(0);
    console.log(selectedSeason, "------", episodes);
  }, [selectedSeason, handleSeasonChange]);

  useEffect(() => {
    if (currentEpisode && currentEpisode.is_last) {
      setIsLastEpisode(true);
    } else {
      setIsLastEpisode(false);
    }
  }, [currentEpisode]);

  const renderEpisodeCard = useCallback(
    ({ index, style, isActive, item }) => (
      <EpisodeCard
        key={item.id}
        episode={item}
        index={index}
        isActive={isActive}
        style={style}
        onClick={() => {
          setCurrentEpisode(item);
          setStartTime(item.watched?.time || 0);
          handleEpisodeClick(item.id);
        }}
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
