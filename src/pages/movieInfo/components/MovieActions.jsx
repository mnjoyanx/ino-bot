import React from "react";
import Button from "@components/common/Button";
import SvgPlay from "@assets/icons/SvgPlay";

import styles from "@styles/components/movieInfo.module.scss";

const MovieActions = ({
  movie,
  activeButton,
  ctrl,
  handleMouseEnter,
  handleWatchClick,
  handleContinueWatchingClick,
  handleFavoriteClick,
}) => {
  return (
    <div className={styles["actions-container"]}>
      {movie.canWatch && (
        <Button
          className={styles["action-btn"]}
          onClick={handleWatchClick}
          onMouseEnter={() => handleMouseEnter(0)}
          title="WATCH"
          isActive={activeButton === 0 && ctrl === "movieInfo"}
          icon={<SvgPlay />}
        />
      )}
      <Button
        className={styles["action-btn"]}
        onClick={handleContinueWatchingClick}
        onMouseEnter={() => handleMouseEnter(1)}
        title="CONTINUE WATCHING"
        isActive={activeButton === 1 && ctrl === "movieInfo"}
      />
      <Button
        className={styles["action-btn"]}
        onClick={handleFavoriteClick}
        onMouseEnter={() => handleMouseEnter(2)}
        title="FAVORITE"
        isActive={activeButton === 2 && ctrl === "movieInfo"}
      />
    </div>
  );
};

export default MovieActions;
