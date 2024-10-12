import styles from "@styles/components/movieCard.module.scss";

const MovieCard = ({ style, isActive, name, poster }) => {
  return (
    <div
      style={style}
      className={`${styles["movie-card_parent"]} ${isActive ? styles["active"] : ""}`}
    >
      <div className={styles["movie-card"]}>
        <img src={poster} alt={name} />
      </div>
      <p className={styles["title"]}>{name}</p>
    </div>
  );
};

export default MovieCard;
