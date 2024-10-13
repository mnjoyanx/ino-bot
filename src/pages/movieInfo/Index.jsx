import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "@styles/components/movieInfo.module.scss";
import AppLogo from "@components/common/AppLogo";
import Button from "@components/common/Button";
import { getMovieById } from "@server/requests"; // Assume this function exists
import useKeydown from "@hooks/useKeydown";

const MovieInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [activeButton, setActiveButton] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await getMovieById({ movie_id: id });
        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.error) {
          setMovie(parsedResponse.message);
        } else {
          console.error(parsedResponse.error);
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
      }
    };

    fetchMovie();
  }, [id]);

  useKeydown({
    isActive: true,
    back: () => navigate(-1),
  });

  if (!movie) {
    return <div>Loading...</div>;
  }

  const handleWatchClick = () => {
    // Implement watch functionality here
    console.log("Watch button clicked");
  };

  const handleMouseEnter = () => {
    setActiveButton(true);
  };

  return (
    <div className={styles["movie-info"]}>
      <div
        className={styles["background-image"]}
        style={{ backgroundImage: `url(${movie.backdrop})` }}
      />
      <div className={styles["content"]}>
        <div className={styles["app-logo"]}>
          <AppLogo />
        </div>
        <h1 className={styles["title"]}>{movie.name}</h1>
        <div className={styles["metadata"]}>
          <span>{movie.year}</span>
          <span>{movie.pg}+</span>
          <span>{`${movie.duration} min`}</span>
          <span>{movie.type}</span>
        </div>
        <p className={styles["description"]}>{movie.description}</p>
        {movie.canWatch && (
          <Button
            className={styles["watch-button"]}
            onClick={handleWatchClick}
            onMouseEnter={handleMouseEnter}
            title={
              <>
                <span className={styles["play-icon"]}></span>
                WATCH
              </>
            }
            isActive={activeButton}
          />
        )}
      </div>
    </div>
  );
};

export default MovieInfo;
