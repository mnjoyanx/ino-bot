import React, { useState, useCallback, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl } from "@app/global";
import ListView from "ino-listview";
import useKeydown from "@hooks/useKeydown";
import MovieCard from "./MovieCard";
import { MoviesContext } from "@context/moviesContext";
import styles from "@styles/components/moviesList.module.scss";
import { setCtrl, setIsOpenMainSidebar } from "../../../app/global";

const MoviesList = () => {
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const { moviesByGenre, selectedGenre } = useContext(MoviesContext);

  const [activeRow, setActiveRow] = useState(0);
  const [activeColumn, setActiveColumn] = useState(0);

  useEffect(() => {
    dispatch(setCtrl("moviesSeries"));
  }, []);

  const currentMovies = selectedGenre ? moviesByGenre[selectedGenre] || {} : {};
  const movieTypes = Object.keys(currentMovies);

  useKeydown({
    isActive: ctrl === "moviesSeries",
    up: () => {
      if (activeRow > 0) {
        setActiveRow(activeRow - 1);
      }
    },

    left: () => {
      if (
        currentMovies &&
        !currentMovies.tv_show.length &&
        !currentMovies.movies.length
      ) {
        dispatch(setCtrl("mainSidebar"));
        dispatch(setIsOpenMainSidebar(true));
      }
    },

    down: () => {
      if (!moviesByGenre[selectedGenre].tv_show.length) return;
      if (activeRow < 1) {
        setActiveRow(activeRow + 1);
      }
      if (ctrl !== "moviesSeries") {
        dispatch(setCtrl("moviesSeries"));
      }
    },

    // back: () => {
    //   dispatch(setCtrl("mainSidebar"));
    //   dispatch(setIsOpenMainSidebar(true));
    // },
  });

  const renderMovieCard = useCallback(
    ({ index, style, isActive, item }) => (
      <MovieCard
        id={item.id}
        key={item.id}
        style={style}
        isActive={isActive}
        name={item.name}
        poster={item.poster}
      />
    ),
    []
  );

  const renderContent = (movieType, movies) => {
    if (!movies || movies.length === 0) {
      return (
        <div className={styles["no-content"]}>
          {`There are no ${movieType === "tv_show" ? "TV shows" : "movies"} available.`}
        </div>
      );
    }

    return (
      <ListView
        id={`movie_list_${movieType}`}
        uniqueKey={`movies-${movieType}-list`}
        itemsTotal={movies.length}
        itemsCount={2}
        listType="horizontal"
        itemWidth={24}
        itemHeight={27}
        isActive={
          ctrl === "moviesSeries" && activeRow === movieTypes.indexOf(movieType)
        }
        activeCol={activeColumn}
        buffer={5}
        debounce={100}
        nativeControle={true}
        renderItem={renderMovieCard}
        data={movies}
        onBackScrollIndex={0}
        onLeft={() => {
          dispatch(setCtrl("mainSidebar"));
          dispatch(setIsOpenMainSidebar(true));
        }}
      />
    );
  };

  return (
    <div
      className={`${styles["movies-list"]} ${activeRow > 0 ? styles["up"] : ""}`}
    >
      {movieTypes.map((movieType) => (
        <div key={movieType} className={styles["wrapper"]}>
          <h2 className={styles["movies-list_title"]}>
            {movieType === "tv_show" ? "Series" : "Movies"}
          </h2>
          {renderContent(movieType, currentMovies[movieType])}
        </div>
      ))}
    </div>
  );
};

export default React.memo(MoviesList);
