import styles from "@styles/components/movieCard.module.scss";
import { useContext } from "react";
import { MoviesContext } from "@context/moviesContext";

const MovieCard = ({ index, style, isActive }) => {
  const { moviesByGenre, selectedGenre } = useContext(MoviesContext);

  const item = moviesByGenre[selectedGenre][index];

  return (
    <div
      style={style}
      className={`${styles["movie-card_parent"]} ${isActive ? styles["active"] : ""}`}
    >
      <div className={styles["movie-card"]}>
        <img src={item.poster} alt={item.name} />
      </div>
      <p className={styles["title"]}>{item.name}</p>
    </div>
  );
};

export default MovieCard;
