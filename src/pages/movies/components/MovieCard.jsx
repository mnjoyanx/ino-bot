import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "@styles/components/movieCard.module.scss";
import useKeydown from "@hooks/useKeydown";

const MovieCard = React.memo(({ style, isActive, name, poster, id }) => {
  const navigate = useNavigate();

  const handleNavigation = useCallback(() => {
    navigate(`/movie/${id}`);
  }, [navigate, id]);

  useKeydown({
    isActive,
    ok: handleNavigation,
  });

  return (
    <div
      style={style}
      className={`${styles["movie-card_parent"]} ${isActive ? styles["active"] : ""}`}
      onClick={handleNavigation}
    >
      <div className={styles["movie-card"]}>
        <img src={poster} alt={name} />
      </div>
      <p className={styles["title"]}>{name}</p>
    </div>
  );
});

export default MovieCard;
