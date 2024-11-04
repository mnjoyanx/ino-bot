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
    selectedType,
    setSelectedType,
  } = useContext(MoviesContext);

  const [url, setUrl] = useState(null);
  const [isVertical, setIsVertical] = useState(true);
  const [isGenresLoading, setIsGenresLoading] = useState(false);
  const [isMoviesLoading, setIsMoviesLoading] = useState(false);
  const [isConfigsLoading, setIsConfigsLoading] = useState(false);

  const getGenresHandler = useCallback(async () => {
    setIsGenresLoading(true);
    try {
      const response = await getAllGenres();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        setGenres(message.rows);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsGenresLoading(false);
    }
  }, [setGenres, setSelectedGenre, selectedGenre]);

  const fetchRecentlyAddedHandler = useCallback(async () => {
    setIsMoviesLoading(true);
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
    setIsMoviesLoading(true);
    try {
      const response = await getFavorites();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        console.log(error);
      } else {
        setMoviesByGenre("favorites", message.rows);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchLastWatchedHandler = useCallback(async () => {
    setIsMoviesLoading(true);
    try {
      const response = await getLastWatchedMovies();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        console.log(error);
      } else {
        setMoviesByGenre("lastWatched", message);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getMoviesByGenreHandler = useCallback(async (type) => {
    setIsMoviesLoading(true);
    const defaultGenres = ["favorites", "lastWatched", "recentlyAdded"];
    if (selectedType && !defaultGenres.includes(type)) {
      return; // Movies for this genre are already fetched
    }

    if (type === "favorites") {
      fetchFavoritesHandler();
      return;
    } else if (type === "recentlyAdded") {
      fetchRecentlyAddedHandler();
      return;
    } else if (type === "lastWatched") {
      fetchLastWatchedHandler();
      return;
    }

    try {
      const filters = {
        query: JSON.stringify({ filter: { type } }),
      };

      const response = await getAllMovies(filters);
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        setMoviesByGenre(type, message.rows);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsMoviesLoading(false);
    }
  }, []);

  const toggleSearchBar = () => {
    dispatch(setIsMovieSearchBarOpen(!isMovieSearchBarOpen));
  };

  const getConfigsHandler = async () => {
    setIsConfigsLoading(true);
    try {
      const response = await getAppSettings({
        languageId: LOCAL_STORAGE.LANGUAGE.GET(),
      });

      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;

      if (error) {
        console.log(error);
      } else {
        const menu = message.menu;
        const firstItem = menu.find((item) => item.position === 1);
        setSelectedType(firstItem.type);
        setMenuList(menu);
        setIsVertical(message.app_settings.isPortrait);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsConfigsLoading(false);
    }
  };

  useEffect(() => {
    getConfigsHandler();
  }, []);

  useEffect(() => {
    if (selectedType) {
      getMoviesByGenreHandler(selectedType);
    }
  }, [selectedType, getMoviesByGenreHandler]);

  useEffect(() => {
    if (genres.length === 0) {
      getGenresHandler();
    }
  }, [genres, getGenresHandler]);

  useEffect(() => {
    if (selectedType) {
      getMoviesByGenreHandler(selectedType);
    }
  }, [selectedType, getMoviesByGenreHandler]);

  useEffect(() => {
    console.log(moviesByGenre, "moviesByGenremoviesByGenre");
  }, [moviesByGenre]);

  return (
    <>
      {moviesByGenre && Object.keys(moviesByGenre).length ? (
        <div className="home-page">
          {!isMovieSearchBarOpen ? (
            <BackButton
              path="Menu"
              onDownHandler={() => {
                dispatch(setCtrl("moviesSeries"));
              }}
            />
          ) : null}
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
                <MoviesList
                  isVertical={isVertical}
                  isLoading={isGenresLoading || isMoviesLoading}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles["loading"]}>Loading...</div>
      )}
    </>
  );
};

export default MoviesPage;
