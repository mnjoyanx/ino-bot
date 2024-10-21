import { useState, useEffect, useContext, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MoviesContext } from "@context/moviesContext";
import {
  getAllMovies,
  getAllGenres,
  getFavorites,
  getLastWatchedMovies,
} from "@server/requests";
import styles from "@styles/components/moviePage.module.scss";
import AppLogo from "@components/common/AppLogo";
import MainSidebar from "@components/common/MainSidebar";
import MoviesList from "./components/MoviesList";
import {
  selectIsMovieSearchBarOpen,
  setIsMovieSearchBarOpen,
} from "@app/global";
import Search from "@components/search/Search";

const MoviesPage = () => {
  const isMovieSearchBarOpen = useSelector(selectIsMovieSearchBarOpen);
  const dispatch = useDispatch();
  const {
    genres,
    setGenres,
    selectedGenre,
    setSelectedGenre,
    moviesByGenre,
    setMoviesByGenre,
  } = useContext(MoviesContext);

  const [url, setUrl] = useState(null);

  const getGenresHandler = useCallback(async () => {
    console.log("getGenresHandler", selectedGenre);
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

  const fetchRecentlyAddedHandler = useCallback(async () => {
    try {
      const filters = {
        query: JSON.stringify({
          between: { createdAt: { from: "2024-01-01", to: "2024-10-31" } },
        }),
      };

      const response = await getAllMovies(filters);
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        const lastTenMovies = message.rows.slice(0, 10);
        setMoviesByGenre("recentlyAdded", lastTenMovies);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchFavoritesHandler = useCallback(async () => {
    try {
      const response = await getFavorites();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        console.log(error);
      } else {
        console.log(message, " mess");
        setMoviesByGenre("favorites", message.rows);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchLastWatchedHandler = useCallback(async () => {
    try {
      const response = await getLastWatchedMovies();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        console.log(error);
      } else {
        console.log(message, " message lastWatched");
        setMoviesByGenre("lastWatched", message);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getMoviesByGenreHandler = useCallback(
    async (genreId) => {
      const defaultGenres = ["favorites", "lastWatched", "recentlyAdded"];
      if (selectedGenre && !defaultGenres.includes(genreId)) {
        return; // Movies for this genre are already fetched
      }

      if (genreId === "favorites") {
        fetchFavoritesHandler();
        return;
      } else if (genreId === "recentlyAdded") {
        fetchRecentlyAddedHandler();
        return;
      } else if (genreId === "lastWatched") {
        fetchLastWatchedHandler();
        return;
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
    [fetchFavoritesHandler, setMoviesByGenre]
  );

  const toggleSearchBar = () => {
    dispatch(setIsMovieSearchBarOpen(!isMovieSearchBarOpen));
  };

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
    <>
      {isMovieSearchBarOpen ? (
        <Search type={"content"} setUrl={setUrl} setShow={toggleSearchBar} />
      ) : null}
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
    </>
  );
};

export default MoviesPage;
