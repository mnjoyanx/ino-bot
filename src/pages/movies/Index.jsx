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
  setCtrl,
  selectIsMovieSearchBarOpen,
  setIsMovieSearchBarOpen,
} from "@app/global";
import Search from "@components/search/Search";
import BackButton from "@components/common/BackButton";
import LOCAL_STORAGE from "@utils/localStorage.js";

import "@styles/moviePage.scss";
import { getAppSettings } from "../../server/requests";

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
    menuList,
    setMenuList,
  } = useContext(MoviesContext);

  const [url, setUrl] = useState(null);
  const [alreadyFetched, setAlreadyFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getGenresHandler = useCallback(async () => {
    try {
      const response = await getAllGenres();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      setAlreadyFetched(true);

      if (error) {
        console.log(error);
      } else {
        setGenres(message.rows);
        if (!selectedGenre && message.rows.length > 0) {
          setSelectedGenre(message.rows[0].id);
        }
      }
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
    [fetchFavoritesHandler, setMoviesByGenre],
  );

  const toggleSearchBar = () => {
    dispatch(setIsMovieSearchBarOpen(!isMovieSearchBarOpen));
  };

  const getConfigsHandler = async () => {
    setIsLoading(true);

    try {
      const response = await getAppSettings({
        languageId: LOCAL_STORAGE.LANGUAGE.GET(),
      });

      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        console.log(message, "message");
        const menu = message.menu;
        console.log(menu, "menu");
        setMenuList(menu);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getConfigsHandler();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      getMoviesByGenreHandler(selectedGenre);
    }
  }, [selectedGenre, getMoviesByGenreHandler]);

  useEffect(() => {
    if (genres.length === 0 && !alreadyFetched) {
      getGenresHandler();
    } else if (!selectedGenre && genres.length > 0) {
      console.log(genres, "genres");
      setSelectedGenre(genres[0].id);
    }
  }, [
    genres,
    getGenresHandler,
    selectedGenre,
    setSelectedGenre,
    alreadyFetched,
  ]);

  return (
    <>
      {isLoading ? (
        <div className={styles["loading"]}>Loading...</div>
      ) : (
        <div className="home-page">
          <BackButton
            path="Menu"
            onDownHandler={() => {
              dispatch(setCtrl("moviesSeries"));
            }}
          />
          <div className="app-logo">
            <AppLogo />
          </div>
          {isMovieSearchBarOpen ? (
            <Search
              type={"content"}
              setUrl={setUrl}
              setShow={toggleSearchBar}
            />
          ) : null}
          <div className={styles["movie-page"]}>
            <div className={styles["movie-content"]}>
              <MainSidebar categories={genres} />
              <div className={styles["movies-list"]}>
                <MoviesList />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MoviesPage;
