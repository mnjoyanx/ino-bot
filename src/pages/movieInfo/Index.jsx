import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "@styles/components/movieInfo.module.scss";
import Button from "@components/common/Button";
import { getMovieById, getMovieUrl } from "@server/requests"; // Assume this function exists
import useKeydown from "@hooks/useKeydown";
import SvgPlay from "@assets/icons/SvgPlay";
import Player from "@components/player/Player";
import { useToast } from "@hooks/useToast";
import { useDispatch } from "react-redux";
import { setPlayerType } from "@app/channels/channelsSlice";
import {
  selectIsPlayerOpen,
  setIsPlayerOpen,
  selectCtrl,
  setCtrl,
} from "@app/global";
import { addFavorite } from "../../server/requests";
const MovieInfo = () => {
  const dispatch = useDispatch();

  const { id } = useParams();
  const navigate = useNavigate();

  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const ctrl = useSelector(selectCtrl);
  const [movie, setMovie] = useState(null);
  const [url, setUrl] = useState(null);
  const [activeButton, setActiveButton] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const { showToast, hideToast } = useToast();
  const maxRetries = 3;

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

  const handleWatchClick = useCallback(async () => {
    console.log("Watch button clicked");
    const response = await getMovieUrl({ id });
    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.error) {
      dispatch(setIsPlayerOpen(true));
      dispatch(setPlayerType("vod"));
      dispatch(setCtrl("vodCtrl"));
      setUrl(parsedResponse.message.stream_url);
    }
  }, [id]);

  // const handleRetry = useCallback(() => {
  //   if (retryCount < maxRetries) {
  //     setRetryCount((prevCount) => prevCount + 1);
  //     showToast(
  //       `Attempting to replay... (${retryCount + 1}/${maxRetries})`,
  //       "retrying"
  //     );
  //   } else {
  //     hideToast();
  //     showToast("Unable to play movie. Please try again later.", "error", 5000);
  //     setRetryCount(0);
  //   }
  // }, [retryCount, maxRetries, showToast, hideToast]);

  const handleContinueWatchingClick = useCallback(() => {
    console.log("Continue Watching button clicked");
    // Implement continue watching functionality here
  }, []);

  const handleFavoriteClick = async () => {
    console.log("Favorite button clicked");
    try {
      const response = await addFavorite({ movieId: id });
      const parsedResponse = JSON.parse(response);
      if (!parsedResponse.error) {
        showToast("Movie added to favorites", "success", 3000);
      } else {
        showToast("Failed to add movie to favorites", "error", 3000);
      }
    } catch (error) {
      console.error("Failed to add movie to favorites:", error);
    }
  };

  const handleMouseEnter = useCallback((index) => {
    setActiveButton(index);
  }, []);

  useKeydown({
    isActive: ctrl === "movieInfo",
    back: () => {
      dispatch(setCtrl("moviesSeries"));
      navigate(-1);
    },
    left: () => setActiveButton((prev) => Math.max(0, prev - 1)),
    right: () => setActiveButton((prev) => Math.min(2, prev + 1)),
    ok: () => {
      switch (activeButton) {
        case 0:
          handleWatchClick();
          break;
        case 1:
          handleContinueWatchingClick();
          break;
        case 2:
          handleFavoriteClick();
          break;
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
        <div
          className={styles["background-image"]}
          style={{ backgroundImage: `url(${movie.backdrop})` }}
        />
        <div className={styles["content"]}>
          <h1 className={styles["title"]}>{movie.name}</h1>
          <div className={styles["metadata"]}>
            <span>{movie.year}</span>
            <span>{movie.pg}+</span>
            <span>{`${movie.duration} min`}</span>
            <span>{movie.type}</span>
          </div>
          <p className={styles["description"]}>{movie.description}</p>
          <div className={styles["actions-container"]}>
            {movie.canWatch && (
              <Button
                className={styles["action-btn"]}
                onClick={handleWatchClick}
                onMouseEnter={() => handleMouseEnter(0)}
                title="WATCH"
                isActive={activeButton === 0}
                icon={<SvgPlay />}
              />
            )}
            <Button
              className={styles["action-btn"]}
              onClick={handleContinueWatchingClick}
              onMouseEnter={() => handleMouseEnter(1)}
              title="CONTINUE WATCHING"
              isActive={activeButton === 1}
            />
            <Button
              className={styles["action-btn"]}
              onClick={handleFavoriteClick}
              onMouseEnter={() => handleMouseEnter(2)}
              title="FAVORITE"
              isActive={activeButton === 2}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieInfo;
