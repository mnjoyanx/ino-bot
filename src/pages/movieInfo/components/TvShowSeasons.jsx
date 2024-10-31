import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import styles from "@styles/components/tvShowSeasons.module.scss";
import SeasonEpisodes from "./SeasonEpisodes";
import { getEpisodes } from "@server/requests";
import Button from "@components/common/Button";
import useKeydown from "@hooks/useKeydown";
import { useMovieInfo } from "@context/movieInfoContext";

const TvShowSeasons = ({ seasons, seriesId }) => {
  const ctrl = useSelector(selectCtrl);
  const navigate = useNavigate();
  const {
    currentEpisode,
    setCurrentEpisode,
    setUrl,
    activeSeason,
    setActiveSeason,
    selectedSeason,
    setSelectedSeason,
  } = useMovieInfo();

  const [allEpisodes, setAllEpisodes] = useState(null);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const getEpisodeBySeasonId = async (seasonId) => {
    const response = await getEpisodes({ season_id: seasonId });
    return JSON.parse(response);
  };

  const fetchAllEpisodes = async () => {
    try {
      setIsLoading(true);
      const allEpisodesClone = {};

      const res = await Promise.all(
        seasons.map((season) => {
          allEpisodesClone[season.id] = [];
          return getEpisodeBySeasonId(season.id);
        }),
      );

      let lastWatchedEpisodeId = null;

      res.forEach((item) => {
        if (!item.error) {
          item.message.forEach((episode, index) => {
            if (!episode.watched && index === item.message.length - 1) {
              lastWatchedEpisodeId = res[0].message[0].id;
            }
            allEpisodesClone[episode.seasonId].push(episode);
          });
        } else {
        }

        console.log(lastWatchedEpisodeId, "lastWatchedEpisodeId-----");

        setCurrentEpisode(lastWatchedEpisodeId);
        setAllEpisodes(allEpisodesClone);
      });
    } catch (error) {
      console.log(error, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setActiveSeason(0);
    fetchAllEpisodes();
  }, [seasons]);

  useEffect(() => {
    if (allEpisodes) {
      setSelectedSeason(seasons[activeSeason].id);
    }
  }, [allEpisodes]);

  useKeydown({
    isActive: ctrl === "seasons",
    left: () => setActiveSeason((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveSeason((prev) => Math.min(seasons.length - 1, prev + 1)),
    down: () => {
      if (allEpisodes && allEpisodes[selectedSeason]?.length > 0) {
        dispatch(setCtrl("episodes"));
      }
    },
    up: () => {
      if (allEpisodes && allEpisodes[selectedSeason]?.length > 0) {
        dispatch(setCtrl("movieInfo"));
      }
    },
    ok: () => {
      if (allEpisodes) {
        setSelectedSeason(seasons[activeSeason].id);
        setActiveSeasonIndex(activeSeason);
      }
    },
    back: () => {
      if (allEpisodes && allEpisodes[selectedSeason]?.length > 0) {
        dispatch(setCtrl("movieInfo"));
      } else {
        navigate(-1);
      }
    },
  });

  return (
    <div className={styles["seasons-container"]}>
      <h2>Seasons</h2>
      <div className={styles["seasons-list"]}>
        {seasons.map((season, index) => (
          <Button
            key={season.id}
            onClick={() => setActiveSeason(index)}
            onMouseEnter={() => {}}
            className={`${styles["season-button"]} ${
              season.id === selectedSeason ? styles["selected"] : ""
            }`}
            isActive={ctrl === "seasons" && index === activeSeason}
            title={`Season ${season.id}`}
            index={index}
          />
        ))}
      </div>
      {allEpisodes &&
      selectedSeason &&
      allEpisodes[selectedSeason]?.length > 0 &&
      !isLoading ? (
        <SeasonEpisodes
          episodes={allEpisodes[selectedSeason]}
          allEpisodes={allEpisodes}
          selectedSeason={selectedSeason}
          changeSeason={(index) => {
            setSelectedSeason(seasons[index].id);
          }}
          activeSeasonIndex={activeSeasonIndex}
          seasonsLength={seasons.length}
          seriesId={seriesId}
          setActiveSeason={setActiveSeason}
          setUrl={setUrl}
        />
      ) : (
        <>
          {isLoading ? (
            <div className={styles["loading"]}>Loading...</div>
          ) : (
            <div className={styles["no-episodes"]}>No episodes found</div>
          )}
        </>
      )}
    </div>
  );
};

export default TvShowSeasons;
