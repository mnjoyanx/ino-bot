import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "@styles/components/movieCard.module.scss";
import useKeydown from "@hooks/useKeydown";
import { setCtrl } from "@app/global";
import { useDispatch } from "react-redux";

const MovieCard = React.memo(
  ({ style, isActive, name, poster, id, onCardClick }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleNavigation = useCallback(() => {
      console.log("id", id);
      navigate(`/movie/${id}`);
      dispatch(setCtrl("movieInfo"));
    }, [navigate, id, dispatch]);

    useKeydown({
      isActive,
      ok: (index, row) => {
        if (onCardClick) {
          onCardClick(index, row);
        }
        handleNavigation();
      },
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
        <p className={`${styles["title"]} one-line`}>{name}</p>
      </div>
    );
  }
);

export default MovieCard;
