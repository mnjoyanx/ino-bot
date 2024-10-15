import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styles from "@styles/components/movieInfo.module.scss";
import { useMovieActions } from "./hooks/useMovieActions";
import { useMovieKeyboardNavigation } from "./hooks/useMovieKeyboardNavigation";
import MovieBackground from "./components/MovieBackground";
import MovieContent from "./components/MovieContent";
import MovieActions from "./components/MovieActions";
import Player from "@components/player/Player";
import useKeydown from "@hooks/useKeydown";
import { selectIsPlayerOpen, selectCtrl, setCtrl } from "@app/global";
import { getMovieById } from "@server/requests";
import TvShowSeasons from "./components/TvShowSeasons";

const MovieInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const ctrl = useSelector(selectCtrl);
  const [movie, setMovie] = useState(null);
  const [url, setUrl] = useState(null);
  const [activeButton, setActiveButton] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [activeSeason, setActiveSeason] = useState(0);

  const { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick } =
    useMovieActions(id, setUrl);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await getMovieById({ movie_id: id });
        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.error) {
          setMovie(parsedResponse.message);
        } else {
          console.error(parsedResponse.error);
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
      }
    };

    fetchMovie();
  }, [id]);

  const handleMouseEnter = useCallback((index) => {
    setActiveButton(index);
  }, []);

  useEffect(() => {
    dispatch(setCtrl("movieInfo"));
  }, [dispatch]);

  const keydownHandlers = useMovieKeyboardNavigation({
    ctrl,
    activeButton,
    setActiveButton,
    navigate,
    handleWatchClick,
    handleContinueWatchingClick,
    handleFavoriteClick,
    movie,
    setCtrl: (newCtrl) => dispatch(setCtrl(newCtrl)),
  });

  useKeydown({
    ...keydownHandlers,
    down: () => {
      if (ctrl === "movieInfo") {
        dispatch(setCtrl("seasons"));
      } else if (ctrl === "seasons") {
        dispatch(setCtrl("episodes"));
      }
    },
    up: () => {
      if (ctrl === "episodes") {
        dispatch(setCtrl("seasons"));
      } else if (ctrl === "seasons") {
        dispatch(setCtrl("movieInfo"));
      }
    },
  });

  if (!movie) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {url && isPlayerOpen && (
        <Player
          type="vod"
          url={url}
          retryC={retryCount}
          setRetryC={setRetryCount}
        />
      )}
      <div className={styles["movie-info"]}>
        <MovieBackground backdrop={movie.backdrop} />
        <MovieContent movie={movie} />
        <MovieActions
          movie={movie}
          activeButton={activeButton}
          handleMouseEnter={handleMouseEnter}
          handleWatchClick={handleWatchClick}
          handleContinueWatchingClick={handleContinueWatchingClick}
          handleFavoriteClick={handleFavoriteClick}
          ctrl={ctrl}
        />
        {movie.type === "tv_show" && (
          <TvShowSeasons
            seasons={movie.seasons}
            activeSeason={activeSeason}
            setActiveSeason={setActiveSeason}
            ctrl={ctrl}
          />
        )}
      </div>
    </>
  );
};

export default MovieInfo;
