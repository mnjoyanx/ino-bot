import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import MovieBackground from "./components/MovieBackground";
import MovieContent from "./components/MovieContent";
import MovieActions from "./components/MovieActions";
import TvShowSeasons from "./components/TvShowSeasons";
import Player from "@components/player/Player";
import { getMovieById } from "@server/requests";
import useKeydown from "@hooks/useKeydown";
import { selectIsPlayerOpen, selectCtrl, setCtrl } from "@app/global";
import { MovieInfoProvider, useMovieInfo } from "@context/movieInfoContext";

import styles from "@styles/components/movieInfo.module.scss";

const MovieInfoContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const { url, setUrl } = useMovieInfo();

  const [movie, setMovie] = useState(null);

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

  useEffect(() => {
    if (ctrl !== "movieInfo") {
      dispatch(setCtrl("movieInfo"));
    }
  }, []);

  useKeydown({
    back: () => navigate(-1),
  });

  if (!movie) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles["movie-info"]}>
      <MovieBackground backdrop={movie.backdrop} />
      <MovieContent movie={movie} />
      <MovieActions movie={movie} movieId={id} />
      {movie.type === "tv_show" && (
        <TvShowSeasons seasons={movie.seasons} seriesId={id} />
      )}
      {isPlayerOpen && url && (
        <Player
          type="vod"
          url={url}
          pipMode={false}
          title={movie.name}
          setUrl={setUrl}
          setRetryC={() => {}}
        />
      )}
    </div>
  );
};

const MovieInfo = () => (
  <MovieInfoProvider>
    <MovieInfoContent />
  </MovieInfoProvider>
);

export default MovieInfo;
