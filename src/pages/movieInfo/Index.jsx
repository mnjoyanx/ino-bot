import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import MovieBackground from "./components/MovieBackground";
import MovieContent from "./components/MovieContent";
import MovieActions from "./components/MovieActions";
import TvShowSeasons from "./components/TvShowSeasons";
import Player from "@components/player/Player";
import { getMovieById, rememberTime } from "@server/requests";
import useKeydown from "@hooks/useKeydown";
import { selectIsPlayerOpen, selectCtrl, setCtrl } from "@app/global";
import { MovieInfoProvider, useMovieInfo } from "@context/movieInfoContext";

import styles from "@styles/components/movieInfo.module.scss";
import { setIsPlayerOpen } from "../../app/global";

const MovieInfoContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const {
    url,
    setUrl,
    movieInfo,
    setMovieInfo,
    currentEpisode,
    setCurrentEpisode,
    startTime,
    setStartTime,
  } = useMovieInfo();

  const fetchMovie = async () => {
    try {
      const response = await getMovieById({ movie_id: id });
      const parsedResponse = JSON.parse(response);
      if (!parsedResponse.error) {
        setStartTime(parsedResponse.message.watched?.time || 0);
        setMovieInfo(parsedResponse.message);
      } else {
        console.error(parsedResponse.error);
      }
    } catch (error) {
      console.error("Failed to fetch movie:", error);
    }
  };

  const rememberTimeHandler = async (
    currentTime,
    percent,
    needToRefetch = false
  ) => {
    const body = {
      movieId: id,
      time: currentTime,
      percent,
    };
    try {
      const response = await rememberTime(body);
      if (needToRefetch) {
        fetchMovie();
      }
      console.log("rememberTimeHandler", response);
    } catch (error) {
      console.error("Failed to remember time:", error);
    }
  };

  const onEnded = () => {
    dispatch(setCtrl("movieInfo"));
    dispatch(setIsPlayerOpen(false));
    setUrl("");
  };

  // const showNextEpisode =
  //   movieInfo &&
  //   movieInfo.type === "tv_show" &&
  //   currentEpisode < movieInfo.episodes.length - 1;

  useEffect(() => {
    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (ctrl !== "movieInfo") {
      dispatch(setCtrl("movieInfo"));
    }
  }, []);

  useKeydown({
    back: () => navigate(-1),
  });

  if (!movieInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles["movie-info"]}>
      <MovieBackground backdrop={movieInfo.backdrop} />
      <MovieContent movie={movieInfo} />
      <MovieActions movie={movieInfo} movieId={id} />
      {movieInfo.type === "tv_show" && (
        <TvShowSeasons seasons={movieInfo.seasons} seriesId={id} />
      )}
      {isPlayerOpen && url && (
        <Player
          type="vod"
          url={url}
          pipMode={false}
          title={movieInfo.name}
          setUrl={setUrl}
          setRetryC={() => {}}
          onRememberTime={rememberTimeHandler}
          startTime={startTime}
          onEnded={onEnded}
          showNextEpisode={movieInfo.type === "tv_show"}
        />
      )}
    </div>
  );
};

const MovieInfo = () => (
  <MovieInfoProvider>
    <MovieInfoContent />
  </MovieInfoProvider>
);

export default MovieInfo;
