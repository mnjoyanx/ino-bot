import React from "react";
import styles from "@styles/components/movieInfo.module.scss";

const MovieBackground = ({ backdrop }) => {
  return (
    <div
      className={styles["background-image"]}
      style={{ backgroundImage: `url(${backdrop})` }}
    />
  );
};

export default MovieBackground;
