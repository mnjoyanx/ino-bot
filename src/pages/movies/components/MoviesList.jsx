import React, { useState, useCallback, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl } from "@app/global";
import ListView from "@components/lists/ListView";
import useKeydown from "@hooks/useKeydown";
import MovieCard from "./MovieCard";
import { MoviesContext } from "@context/moviesContext";
import styles from "@styles/components/moviesList.module.scss";
import { setCtrl, setIsOpenMainSidebar } from "../../../app/global";

const MoviesList = () => {
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const { moviesByGenre, selectedGenre } = useContext(MoviesContext);
  console.log(moviesByGenre, "moviesByGenre");

  const [activeRow, setActiveRow] = useState(0);
  const [activeColumn, setActiveColumn] = useState(0);

  const currentMovies = selectedGenre ? moviesByGenre[selectedGenre] || {} : {};
  const movieTypes = Object.keys(currentMovies);

  console.log(currentMovies, "currentMovies");

  useKeydown({
    isActive: ctrl === "moviesSeries",
    up: useCallback(() => {
      setActiveRow((prev) => Math.max(0, prev - 1));
    }, []),
    down: useCallback(() => {
      setActiveRow((prev) => Math.min(movieTypes.length - 1, prev + 1));
    }, [movieTypes]),
    left: useCallback(() => {
      if (activeColumn > 0) {
        setActiveColumn((prev) => prev - 1);
      } else {
        dispatch(setCtrl("mainSidebar"));
        dispatch(setIsOpenMainSidebar(true));
      }
    }, [activeColumn, dispatch]),
    right: useCallback(() => {
      const currentMovieList = currentMovies[movieTypes[activeRow]] || [];
      setActiveColumn((prev) =>
        Math.min(currentMovieList.length - 1, prev + 1)
      );
    }, [currentMovies, movieTypes, activeRow]),
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
          activeRow === movieTypes.indexOf(movieType) && ctrl === "moviesSeries"
        }
        activeCol={activeColumn}
        buffer={5}
        debounce={100}
        nativeControle={true}
        renderItem={renderMovieCard}
        data={movies}
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
