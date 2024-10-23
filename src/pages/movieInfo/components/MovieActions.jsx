import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import Button from "@components/common/Button";
import SvgPlay from "@assets/icons/SvgPlay";
import SvgFav from "@assets/icons/SvgFav";
import SvgFavFill from "@assets/icons/SvgFavFill";
import useKeydown from "@hooks/useKeydown";
import { useMovieActions } from "../hooks/useMovieActions";
import styles from "@styles/components/movieInfo.module.scss";
import { useMovieInfo } from "@context/movieInfoContext";
import { formatTime } from "@utils/util";

const MovieActions = ({ movie, movieId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeButton, setActiveButton] = useState(0);
  const ctrl = useSelector(selectCtrl);
  const { setUrl, currentEpisode, movieInfo, setMovieInfo, setStartTime } =
    useMovieInfo();
  const { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick } =
    useMovieActions(
      movieId,
      setUrl,
      movieInfo.type,
      movieInfo.watched?.episodeId,
      setMovieInfo,
      movieInfo.favorite,
      movieInfo.watched?.time || 0,
      setStartTime
    );

  useKeydown({
    isActive: ctrl === "movieInfo",
    left: () => setActiveButton((prev) => Math.max(0, prev - 1)),
    right: () => setActiveButton((prev) => Math.min(2, prev + 1)),
    down: () => {
      if (movie.type !== "tv_show") return;

      dispatch(setCtrl("seasons"));
    },
    ok: () => {
      switch (activeButton) {
        case 0:
          if (movie?.canWatch) handleWatchClick();
          break;
        case 1:
          setStartTime(movie.watched.time);
          handleContinueWatchingClick();
          break;
        case 2:
          handleFavoriteClick();
          break;
      }
    },
    back: () => navigate(-1),
  });

  return (
    <div className={styles["actions-container"]}>
      {movie.canWatch && (
        <Button
          className={styles["action-btn"]}
          onClick={handleWatchClick}
          onMouseEnter={() => setActiveButton(0)}
          title="Watch"
          isActive={activeButton === 0 && ctrl === "movieInfo"}
          icon={<SvgPlay />}
        />
      )}
      {movie.watched ? (
        <Button
          className={styles["action-btn"]}
          onClick={() => {
            setStartTime(movie.watched.time);
            handleContinueWatchingClick();
          }}
          onMouseEnter={() => setActiveButton(1)}
          title={formatTime(movie.watched.time)}
          isActive={activeButton === 1 && ctrl === "movieInfo"}
        />
      ) : null}
      <Button
        className={styles["action-btn"]}
        onClick={handleFavoriteClick}
        onMouseEnter={() => setActiveButton(2)}
        isActive={activeButton === 2 && ctrl === "movieInfo"}
        icon={movie.favorite ? <SvgFavFill /> : <SvgFav />}
      />
    </div>
  );
};

export default MovieActions;
