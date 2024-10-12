import { useState, useEffect } from "react";
import { useContext } from "react";
import { MoviesContext } from "@context/moviesContext";
import { getAllMovies, getAllGenres } from "@server/requests";
import styles from "@styles/components/moviePage.module.scss";
import AppLogo from "@components/common/AppLogo";
import MainSidebar from "@components/common/MainSidebar";
import MoviesList from "./components/MoviesList";

const MoviesPage = () => {
  const { setMoviesByGenre } = useContext(MoviesContext);

  const [genres, setGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [moviesAndSeries, setMoviesAndSeries] = useState({});
  const getGenresHandler = async () => {
    setGenresLoading(true);
    try {
      const response = await getAllGenres();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        setGenres(message.rows);
        setSelectedGenre(message.rows[5].id);
      }
      console.log(parsedResponse);
    } catch (error) {
      console.log(error);
    } finally {
      setGenresLoading(false);
    }
  };

  const getMoviesByGenreHandler = async (selectedGenre) => {
    try {
      setMoviesLoading(true);
      const filters = {
        query: JSON.stringify({ filter: { genreId: selectedGenre } }),
      };

      const response = await getAllMovies(filters);
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        setMovies(message.rows);

        const moviesSeries = message.rows.reduce((acc, movie) => {
          if (!acc[movie.type]) {
            acc[movie.type] = [];
          }
          acc[movie.type].push(movie);
          return acc;
        }, {});

        setMoviesAndSeries(moviesSeries);

        setMoviesByGenre(selectedGenre, message.rows);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setMoviesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGenre) {
      getMoviesByGenreHandler(selectedGenre);
    }
  }, [selectedGenre]);

  useEffect(() => {
    getGenresHandler();
  }, []);

  if (genresLoading || moviesLoading) return <div>Loading...</div>;

  return (
    <div className={styles["movie-page"]}>
      <div className={styles["movie-content"]}>
        <div className={styles["app-logo"]}>
          <AppLogo />
        </div>
        <MainSidebar categories={genres} />
        <div className={styles["movies-list"]}>
          <MoviesList movies={moviesAndSeries} />
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;
