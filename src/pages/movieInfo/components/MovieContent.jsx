import React, { useEffect, useState } from "react";
import styles from "@styles/components/movieInfo.module.scss";

const MovieContent = ({ movie, isPlayerOpen }) => {
  return (
    <div
      className={`${styles["content"]} ${window.Android && isPlayerOpen ? styles["hidden"] : ""} ${movie.type === "tv_show" ? styles["tv-show"] : ""}`}
    >
      <h1 className={styles["title"]}>{movie.name}</h1>
      <div className={styles["metadata"]}>
        <span>{movie.year}</span>
        <span>{movie.pg}+</span>
        <span>{`${movie.duration} min`}</span>
        <span>{movie.type}</span>
      </div>
      {movie.casts.length > 0 && (
        <div className={styles["casts"]}>
          {movie.casts.map((cast) => (
            <div className={styles["cast"]}>
              <p className={styles["cast-name"]}>{cast.name}</p>
            </div>
          ))}
        </div>
      )}
      <p className={styles["description"]}>{movie.description}</p>
    </div>
  );
};

export default MovieContent;
