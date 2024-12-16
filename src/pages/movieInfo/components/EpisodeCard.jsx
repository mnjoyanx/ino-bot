import React from "react";
import styles from "@styles/components/seasonEpisodes.module.scss";
import { useImageFallback } from "@hooks/useImageFallback";

const EpisodeCard = ({ episode, index, isActive, style, onClick }) => {
  const imageSrc = useImageFallback(episode.poster);

  // Calculate progress percentage
  const progressPercentage =
    episode.watched?.time && episode.duration
      ? (episode.watched.time / episode.duration) * 100
      : 0;

  return (
    <div style={style} onClick={onClick}>
      <div
        className={`${styles["episode"]} ${isActive ? styles["active"] : ""}`}
      >
        <img
          src={imageSrc}
          alt={episode.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <p className={styles["episode-title"]}>{index + 1}</p>
        {episode.watched?.time > 0 && (
          <div className={styles["progress-bar"]}>
            <div
              className={styles["progress"]}
              style={{ width: `${episode.watched.percent}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeCard;
