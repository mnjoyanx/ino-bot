import React from "react";
import styles from "@styles/components/seasonEpisodes.module.scss";
import { useImageFallback } from "@hooks/useImageFallback";

const EpisodeCard = ({ episode, index, isActive, style }) => {
  const imageSrc = useImageFallback(episode.poster);

  return (
    <div style={style}>
      <div
        className={`${styles["episode"]} ${isActive ? styles["active"] : ""}`}
      >
        <img
          src={imageSrc}
          alt={episode.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <p className={styles["episode-title"]}>{index + 1}</p>
      </div>
    </div>
  );
};

export default EpisodeCard;
