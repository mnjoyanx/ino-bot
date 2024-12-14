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
  selectIsPlayerOpen,
  setCropHost,
  selectSelectedType,
  setSelectedType,
} from "@app/global";
import Search from "@components/search/Search";
import BackButton from "@components/common/BackButton";
import LOCAL_STORAGE from "@utils/localStorage.js";
import { useTranslation } from "react-i18next";

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
    setDynamicContent,
    dynamicContent,
    setMenuList,
  } = useContext(MoviesContext);
  const { t } = useTranslation();

  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const selectedType = useSelector(selectSelectedType);

  const [url, setUrl] = useState(null);
  const [isVertical, setIsVertical] = useState(true);
  const [isGenresLoading, setIsGenresLoading] = useState(true);
  const [isMoviesLoading, setIsMoviesLoading] = useState(true);
  const [isConfigsLoading, setIsConfigsLoading] = useState(true);

  const getGenresHandler = useCallback(async () => {
    setIsGenresLoading(true);
    try {
      const response = await getAllGenres();
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        console.log(error);
      } else {
        // message.rows.forEach((genre) => {
        //   genre.name = t(genre.name);
        // });
        const genres = message.rows.map((genre) => {
          return {
            ...genre,
            name: t(genre.name),
          };
        });
        setGenres(genres);
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
        setDynamicContent(message.rows);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsMoviesLoading(false);
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

      console.log(message, "message");
      if (error) {
        console.log(error);
      } else {
        const menu = message.menu;
        const firstItem = menu.find((item) => item.position === 1);
        // setSelectedType(firstItem.type);
        if (!selectedType) {
          dispatch(
            setSelectedType(firstItem.type === "movies" ? "movie" : "tv_show"),
          );
        }
        setMenuList(menu);
        setIsVertical(message.app_settings.isPortrait);
        dispatch(setCropHost(message.app_settings.image_crop_host));
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsConfigsLoading(false);
    }
  };

  useEffect(() => {
    if (isPlayerOpen) {
      document.body.classList.add("player-open");
    } else {
      document.body.classList.remove("player-open");
    }
  }, [isPlayerOpen]);

  useEffect(() => {
    getConfigsHandler();
  }, []);

  useEffect(() => {
    if (selectedType) {
      if (moviesByGenre[selectedType] && moviesByGenre[selectedType].length)
        return;
      getMoviesByGenreHandler(selectedType);
    }
  }, [selectedType, getMoviesByGenreHandler, moviesByGenre]);

  useEffect(() => {
    if (genres.length === 0) {
      getGenresHandler();
    }
  }, [genres, getGenresHandler]);

  return (
    <>
      {selectedType ? (
        <div className={`home-page ${isPlayerOpen ? "hidden" : ""}`}>
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
                  isLoading={
                    isGenresLoading || isMoviesLoading || isConfigsLoading
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles["movies-loading"]}></div>
      )}
    </>
  );
};

export default MoviesPage;
