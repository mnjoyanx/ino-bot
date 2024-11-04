import React, { useState, useCallback, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setIsMovieSearchBarOpen } from "@app/global";
import { InoButton, ListView } from "ino-ui-tv";

import useKeydown from "@hooks/useKeydown";
import MovieCard from "./MovieCard";
import { MoviesContext } from "@context/moviesContext";
import styles from "@styles/components/moviesList.module.scss";
import {
  selectIsMovieSearchBarOpen,
  setCtrl,
  setIsOpenMainSidebar,
} from "@app/global";

const MoviesList = ({ isVertical, isLoading }) => {
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const { moviesByGenre, selectedType } = useContext(MoviesContext);
  const isMovieSearchBarOpen = useSelector(selectIsMovieSearchBarOpen);

  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    dispatch(setCtrl("moviesSeries"));
  }, []);

  const currentMovies = selectedType ? moviesByGenre[selectedType] || [] : [];

  useKeydown({
    isActive: ctrl === "moviesSeries" && !isMovieSearchBarOpen,
    down: () => {
      if (!currentMovies?.length) return;

      setActiveCategory(Math.min(activeCategory + 1, currentMovies.length - 1));
    },
    up: () => {
      if (activeCategory > 0) {
        setActiveCategory(activeCategory - 1);
      } else {
        dispatch(setCtrl("backBtn"));
      }
    },
  });

  const renderMovieCard = useCallback(
    ({ index, style, isActive, item }) => {
      return (
        <MovieCard
          id={item.id}
          key={item.id}
          style={style}
          isActive={isActive}
          name={item.name}
          poster={item.poster}
          isVertical={isVertical}
        />
      );
    },
    [isVertical],
  );

  const renderCategoryContent = (category, categoryIndex) => {
    if (!category?.list || category.list.length === 0) return null;

    return (
      <div className={styles["category-container"]}>
        <h2 className={styles["movies-list_title"]}>{category.title}</h2>
        <ListView
          id={`movie_list_${category.id}`}
          uniqueKey={`movies-${category.id}-list`}
          itemsTotal={category.list.length}
          itemsCount={5}
          listType="horizontal"
          itemWidth={isVertical ? 35 : 20}
          itemHeight={isVertical ? 20 : 27}
          isActive={ctrl === "moviesSeries" && activeCategory === categoryIndex}
          gap={1}
          buffer={5}
          onLeft={() => {
            dispatch(setCtrl("mainSidebar"));
            dispatch(setIsOpenMainSidebar(true));
          }}
          arrows={{ show: true }}
          debounce={100}
          nativeControle={true}
          renderItem={renderMovieCard}
          data={category.list}
          onBackScrollIndex={0}
        />
      </div>
    );
  };

  return (
    <>
      {currentMovies && currentMovies.length && !isLoading ? (
        <div className={styles["movies-list"]}>
          <ListView
            id="categories_list"
            uniqueKey="categories-list"
            className={styles["categories-list"]}
            itemsTotal={currentMovies.length}
            itemsCount={1}
            listType="vertical"
            itemHeight={35}
            isActive={ctrl === "moviesSeries"}
            buffer={2}
            debounce={100}
            nativeControle={true}
            renderItem={({ index, style, isActive, item }) => (
              <div style={style} className={styles["category-wrapper"]}>
                {renderCategoryContent(item, index)}
              </div>
            )}
            data={currentMovies}
          />
        </div>
      ) : (
        <InoButton
          classNames={styles["no-content_button"]}
          size="large"
          onClick={() => {
            dispatch(setCtrl("inp"));
            dispatch(setIsOpenMainSidebar(false));
            dispatch(setIsMovieSearchBarOpen(true));
          }}
          isActive={ctrl === "moviesSeries"}
          onLeft={() => {
            dispatch(setCtrl("mainSidebar"));
            dispatch(setIsOpenMainSidebar(true));
          }}
        >
          Search
        </InoButton>
      )}
    </>
  );
};

export default React.memo(MoviesList);
