import styles from "@styles/components/movieInfo.module.scss";
import { imageResizer } from "@utils/util";
import { selectCropHost } from "@app/global";
import { useSelector } from "react-redux";
const MovieContent = ({ movie, isPlayerOpen }) => {
  const cropHost = useSelector(selectCropHost);

  const width = window.Android ? 500 : 760;
  const height = window.Android ? 155 : 230;
  return (
    <div
      className={`${styles["content"]} ${window.Android && isPlayerOpen ? styles["hidden"] : ""} ${movie.type === "tv_show" ? styles["tv-show"] : ""}`}
    >
      <div className={styles["shadow"]}></div>
      {movie.image_title ? (
        <img
          src={imageResizer(
            cropHost,
            movie.image_title,
            width,
            height,
            "cover",
            "png",
          )}
          alt={movie.name}
          className={styles["image-title"]}
        />
      ) : (
        <h1 className={styles["title"]}>
          {movie.translations && movie.translations.name
            ? movie.translations.name
            : movie.name}
        </h1>
      )}
      <div className={styles["metadata"]}>
        <span>{movie.year}</span>
        <span>{movie.pg}+</span>
        <span>{`${movie.duration} min`}</span>
        <span>
          {movie.translations && movie.translations.type
            ? movie.translations.type
            : movie.type}
        </span>
      </div>
      {movie.casts.length > 0 && (
        <div className={styles["casts"]} key={movie.id}>
          {movie.casts.map((cast) => (
            <div className={styles["cast"]} key={cast.id}>
              <p className={styles["cast-name"]}>{cast.name}</p>
            </div>
          ))}
        </div>
      )}
      <p className={styles["description"]}>
        {movie.translations && movie.translations.description
          ? movie.translations.description
          : movie.description}
      </p>
    </div>
  );
};

export default MovieContent;
