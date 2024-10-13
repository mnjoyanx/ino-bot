import { useEffect, useContext, useCallback } from "react";
import { MoviesContext } from "@context/moviesContext";
import { getAllMovies, getAllGenres } from "@server/requests";
import styles from "@styles/components/moviePage.module.scss";
import AppLogo from "@components/common/AppLogo";
import MainSidebar from "@components/common/MainSidebar";
import MoviesList from "./components/MoviesList";

const MoviesPage = () => {
  const {
    genres,
    setGenres,
    selectedGenre,
    setSelectedGenre,
    moviesByGenre,
    setMoviesByGenre,
  } = useContext(MoviesContext);

  const getGenresHandler = useCallback(async () => {
    try {
      const response = await getAllGenres();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        setGenres(message.rows);
        if (!selectedGenre && message.rows.length > 0) {
          setSelectedGenre(message.rows[0].id);
        }
      }
      console.log(parsedResponse);
    } catch (error) {
      console.log(error);
    }
  }, [setGenres, setSelectedGenre, selectedGenre]);

  const getMoviesByGenreHandler = useCallback(
    async (genreId) => {
      if (moviesByGenre[genreId]) {
        return; // Movies for this genre are already fetched
      }
      try {
        const filters = {
          query: JSON.stringify({ filter: { genreId } }),
        };

        const response = await getAllMovies(filters);
        const parsedResponse = JSON.parse(response);
        const { error, message } = parsedResponse;

        if (error) {
          console.log(error);
        } else {
          setMoviesByGenre(genreId, message.rows);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [moviesByGenre, setMoviesByGenre]
  );

  useEffect(() => {
    if (selectedGenre) {
      getMoviesByGenreHandler(selectedGenre);
    }
  }, [selectedGenre, getMoviesByGenreHandler]);

  useEffect(() => {
    if (genres.length === 0) {
      getGenresHandler();
    } else if (!selectedGenre && genres.length > 0) {
      setSelectedGenre(genres[0].id);
    }
  }, [genres, getGenresHandler, selectedGenre, setSelectedGenre]);

  return (
    <div className={styles["movie-page"]}>
      <div className={styles["movie-content"]}>
        <div className={styles["app-logo"]}>
          <AppLogo />
        </div>
        <MainSidebar categories={genres} />
        <div className={styles["movies-list"]}>
          <MoviesList />
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;
