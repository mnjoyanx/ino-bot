import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import MovieBackground from "./components/MovieBackground";
import MovieContent from "./components/MovieContent";
import MovieActions from "./components/MovieActions";
import TvShowSeasons from "./components/TvShowSeasons";
import Player from "@components/player/Player";
import {
  getMovieById,
  getMovieCasts,
  getTranslationsMovie,
  rememberTime,
} from "@server/requests";
import useKeydown from "@hooks/useKeydown";
import {
  selectIsPlayerOpen,
  selectCtrl,
  setCtrl,
  selectCropHost,
  setCropHost,
  selectOnEpisodes,
} from "@app/global";
import { MovieInfoProvider, useMovieInfo } from "@context/movieInfoContext";

import styles from "@styles/components/movieInfo.module.scss";
import { setIsPlayerOpen } from "../../app/global";
import { imageResizer } from "@utils/util";

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
    isLastEpisode,
  } = useMovieInfo();
  const onEpisodes = useSelector(selectOnEpisodes);
  const [isLoading, setIsLoading] = useState(false);
  const cropHost = useSelector(selectCropHost);
  const fetchMovie = async () => {
    try {
      setIsLoading(true);
      const response = await getMovieById({ movie_id: id });
      const translationsResponse = await getTranslationsMovie({ movie_id: id });
      const parsedResponse = JSON.parse(response);
      const parsedTranslationsResponse = JSON.parse(translationsResponse);
      if (!parsedResponse.error) {
        setStartTime(parsedResponse.message.watched?.time || 0);
        const castsResponse = await getMovieCasts({ movie_id: id });
        const parsedCastsResponse = JSON.parse(castsResponse);
        setMovieInfo({
          ...parsedResponse.message,
          casts: parsedCastsResponse.message,
          favorite: !!parsedResponse.message.favorites,
          translations: parsedTranslationsResponse.message[0],
        });
      } else {
        console.error(parsedResponse.error);
      }
    } catch (error) {
      console.error("Failed to fetch movie:", error);
    } finally {
      setIsLoading(false);
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

    if (movieInfo.type === "tv_show") {
      body.episodeId = currentEpisode.id;
    }

    try {
      const response = await rememberTime(body);
      if (needToRefetch) {
        fetchMovie();
      }
    } catch (error) {
      console.error("Failed to remember time:", error);
    }
  };

  const onEnded = () => {
    if (movieInfo.type === "tv_show") {
      if (!isLastEpisode) {
        // Trigger the next episode event which is handled by SeasonEpisodes component
        document.dispatchEvent(new Event("next-episode"));
      } else {
        // If it's the last episode, close the player
        dispatch(setCtrl("movieInfo"));
        dispatch(setIsPlayerOpen(false));
        setUrl("");
      }
    } else {
      // For movies, simply close the player
      dispatch(setCtrl("movieInfo"));
      dispatch(setIsPlayerOpen(false));
      setUrl("");
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

  useEffect(() => {
    if (!cropHost) {
      dispatch(setCropHost(localStorage.getItem("crop_host")));
    }
  }, [cropHost]);

  useEffect(() => {
    if (ctrl !== "movieInfo") {
      dispatch(setCtrl("movieInfo"));
    }
  }, [currentEpisode]);

  useEffect(() => {
    if (!currentEpisode && movieInfo?.type === "tv_show") {
      dispatch(setCtrl("seasons"));
    }
  }, [currentEpisode, movieInfo?.type]);

  useEffect(() => {
    if (isPlayerOpen) {
      document.body.classList.add("player-open");
    } else {
      document.body.classList.remove("player-open");
      if (window.Android) {
        window.Android.destroyPlayer();
      }
    }
  }, [isPlayerOpen]);

  useKeydown({
    back: () => navigate(-1),
  });

  if (!movieInfo) {
    return <div className={styles["movie-loading"]}></div>;
  }

  return (
    <div className={styles["movie-info-wrapper"]}>
      <div
        className={`${styles["movie-info"]} ${isPlayerOpen ? styles["hidden"] : ""}`}
      >
        {!isPlayerOpen && movieInfo.backdrop ? (
          <MovieBackground
            backdrop={imageResizer(
              cropHost,
              movieInfo.backdrop,
              1280,
              720,
              "0",
              "jpg"
            )}
          />
        ) : null}
        {isLoading ? (
          <div className={styles["loading"]}></div>
        ) : (
          <>
            <div
              className={`${styles["info-content_wrapper"]} ${onEpisodes ? styles["on-episodes"] : ""}`}
            >
              <MovieContent movie={movieInfo} isPlayerOpen={isPlayerOpen} />
              {movieInfo.type === "movie" ? (
                <MovieActions
                  movie={movieInfo}
                  movieId={id}
                  currentEpisode={null}
                  isPlayerOpen={isPlayerOpen}
                />
              ) : (
                <>
                  {currentEpisode && (
                    <MovieActions
                      movie={movieInfo}
                      movieId={id}
                      currentEpisode={currentEpisode}
                      isPlayerOpen={isPlayerOpen}
                    />
                  )}
                </>
              )}
              {movieInfo.type === "tv_show" && (
                <TvShowSeasons seasons={movieInfo.seasons} seriesId={id} />
              )}
            </div>
            {isPlayerOpen && url && (
              <Player
                type="vod"
                url={url}
                pipMode={false}
                title={movieInfo.name}
                setUrl={setUrl}
                setRetryC={() => {}}
                onRememberTime={rememberTimeHandler}
                // startTime={movieInfo?.watched?.time || startTime || 0}
                startTime={startTime}
                onEnded={onEnded}
                showNextEpisode={movieInfo.type === "tv_show"}
                movieId={id}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const MovieInfo = () => (
  <MovieInfoProvider>
    <MovieInfoContent />
  </MovieInfoProvider>
);

export default MovieInfo;
