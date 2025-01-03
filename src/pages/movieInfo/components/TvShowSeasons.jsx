import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  selectCtrl,
  selectIsPlayerOpen,
  setCtrl,
  setOnEpisodes,
} from "@app/global";
import styles from "@styles/components/tvShowSeasons.module.scss";
import SeasonEpisodes from "./SeasonEpisodes";
import { getEpisodes } from "@server/requests";
import Button from "@components/common/Button";
import useKeydown from "@hooks/useKeydown";
import { useMovieInfo } from "@context/movieInfoContext";

const TvShowSeasons = ({ seasons, seriesId }) => {
  const ctrl = useSelector(selectCtrl);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    currentEpisode,
    setCurrentEpisode,
    setUrl,
    activeSeason,
    setActiveSeason,
    selectedSeason,
    setSelectedSeason,
    activeSeasonIndex,
    setActiveSeasonIndex,
  } = useMovieInfo();
  const isPlayerOpen = useSelector(selectIsPlayerOpen);

  const seasonsListInnerRef = useRef(null);

  const [allEpisodes, setAllEpisodes] = useState(null);
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
        })
      );

      let lastWatchedEpisodeId = null;
      let lastSeasonHasEpisodeIndex = null;

      res.forEach((item, idx) => {
        if (!item.error) {
          item.message.forEach((episode, index) => {
            if (!episode.watched && index === item.message.length - 1) {
              lastWatchedEpisodeId = res[0].message[0].id;
            }
            allEpisodesClone[episode.seasonId].push(episode);
          });

          // if (idx === res.length - 1) {
          //   // lastSeasonHasEpisodeIndex = idx;
          //   console.log(item, "item");

          // }

          if (item.message.length) {
            lastSeasonHasEpisodeIndex = idx;
          }
        }

        if (lastSeasonHasEpisodeIndex && idx === res.length - 1) {
          const lastEpisode =
            res[lastSeasonHasEpisodeIndex].message[
              res[lastSeasonHasEpisodeIndex].message.length - 1
            ];
          lastEpisode.is_last = true;
        }

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

  useEffect(() => {
    if (seasonsListInnerRef.current) {
      if (activeSeason > 4) {
        seasonsListInnerRef.current.style.transform = `translateX(-${
          (activeSeason - 1) * 15
        }rem)`;
      } else {
        seasonsListInnerRef.current.style.transform = `translateX(0)`;
      }
    }
  }, [activeSeason, seasonsListInnerRef]);

  useKeydown({
    isActive: ctrl === "seasons",
    left: () => setActiveSeason((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveSeason((prev) => Math.min(seasons.length - 1, prev + 1)),
    down: () => {
      if (allEpisodes && allEpisodes[selectedSeason]?.length > 0) {
        dispatch(setCtrl("episodes"));
        dispatch(setOnEpisodes(true));
      }
    },
    up: () => {
      if (allEpisodes && allEpisodes[selectedSeason]?.length > 0) {
        dispatch(setCtrl("movieInfo"));
        dispatch(setOnEpisodes(false));
      }
    },
    ok: () => {
      if (allEpisodes) {
        setSelectedSeason(seasons[activeSeason].id);
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
    <div
      className={`${styles["seasons-container"]} ${isPlayerOpen ? styles["hidden"] : ""}`}
    >
      <h2>{t("Seasons")}</h2>
      <div
        className={styles["seasons-list"]}
        style={{ width: `${seasons.length * 16}rem` }}
      >
        <div className={styles["seasons-list_warpper"]}>
          <div
            className={styles["seasons-list-inner"]}
            ref={seasonsListInnerRef}
          >
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
        </div>
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
          setActiveSeasonIndex={setActiveSeasonIndex}
        />
      ) : (
        <>
          {isLoading ? (
            <div className={styles["loading"]}>Loading...</div>
          ) : (
            <div className={styles["no-episodes"]}>
              {t("No episodes found")}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TvShowSeasons;
