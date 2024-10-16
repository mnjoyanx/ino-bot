import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import styles from "@styles/components/tvShowSeasons.module.scss";
import SeasonEpisodes from "./SeasonEpisodes";
import { getEpisodes } from "@server/requests";
import Button from "@components/common/Button";
import useKeydown from "@hooks/useKeydown";

const TvShowSeasons = ({ seasons, seriesId }) => {
  const [activeSeason, setActiveSeason] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const ctrl = useSelector(selectCtrl);
  const dispatch = useDispatch();

  const getEpisodeBySeasonId = async (seasonId) => {
    const response = await getEpisodes({ season_id: seasonId });
    return response;
  };

  const fetchAllEpisodes = async () => {
    try {
      setIsLoading(true);
      const res = await Promise.all(
        seasons.map((season) => getEpisodeBySeasonId(season.id))
      );
      const parsedRes = JSON.parse(res);

      const { error, message } = parsedRes;

      if (!error) {
        const obj = message.reduce((acc, curr) => {
          if (!acc[curr.seasonId]) {
            acc[curr.seasonId] = [];
          }

          acc[curr.seasonId].push(curr);
          return acc;
        }, {});

        setAllEpisodes(obj);
      }
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

  useKeydown({
    isActive: ctrl === "seasons",
    left: () => setActiveSeason((prev) => Math.max(0, prev - 1)),
    right: () =>
      setActiveSeason((prev) => Math.min(seasons.length - 1, prev + 1)),
    down: () => dispatch(setCtrl("episodes")),
    up: () => dispatch(setCtrl("movieInfo")),
    back: () => dispatch(setCtrl("movieInfo")),
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
            className={styles["season-button"]}
            isActive={ctrl === "seasons" && index === activeSeason}
            title={`Season ${season.id}`}
            index={index}
          />
        ))}
      </div>
      {!isLoading && allEpisodes && (
        <SeasonEpisodes
          episodes={allEpisodes[seasons[activeSeason].id]}
          activeSeason={activeSeason}
          seasonsLength={seasons.length}
          seriesId={seriesId}
          setActiveSeason={setActiveSeason}
        />
      )}
    </div>
  );
};

export default TvShowSeasons;
