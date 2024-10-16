import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import Button from "@components/common/Button";
import SvgPlay from "@assets/icons/SvgPlay";
import useKeydown from "@hooks/useKeydown";
import { useMovieActions } from "../hooks/useMovieActions";
import styles from "@styles/components/movieInfo.module.scss";
import { useMovieInfo } from "@context/movieInfoContext";

const MovieActions = ({ movie, movieId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeButton, setActiveButton] = useState(0);
  const ctrl = useSelector(selectCtrl);
  const { setUrl } = useMovieInfo();
  const { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick } =
    useMovieActions(movieId, setUrl);

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
          handleContinueWatchingClick();
          break;
        case 2:
          handleFavoriteClick();
          break;
      }
    },
    back: () => navigate("/movies"),
  });

  return (
    <div className={styles["actions-container"]}>
      {movie.canWatch && (
        <Button
          className={styles["action-btn"]}
          onClick={handleWatchClick}
          onMouseEnter={() => setActiveButton(0)}
          title="WATCH"
          isActive={activeButton === 0 && ctrl === "movieInfo"}
          icon={<SvgPlay />}
        />
      )}
      <Button
        className={styles["action-btn"]}
        onClick={handleContinueWatchingClick}
        onMouseEnter={() => setActiveButton(1)}
        title="CONTINUE WATCHING"
        isActive={activeButton === 1 && ctrl === "movieInfo"}
      />
      <Button
        className={styles["action-btn"]}
        onClick={handleFavoriteClick}
        onMouseEnter={() => setActiveButton(2)}
        title="FAVORITE"
        isActive={activeButton === 2 && ctrl === "movieInfo"}
      />
    </div>
  );
};

export default MovieActions;
