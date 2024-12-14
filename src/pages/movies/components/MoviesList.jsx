import React, { useState, useCallback, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCropHost,
  selectCtrl,
  setIsMovieSearchBarOpen,
} from "@app/global";
import { GridView, InoButton, ListView, ListGridView } from "@ino-ui/tv";
import { useTranslation } from "react-i18next";

import useKeydown from "@hooks/useKeydown";
import MovieCard from "./MovieCard";
import { MoviesContext } from "@context/moviesContext";
import styles from "@styles/components/moviesList.module.scss";
import {
  selectIsMovieSearchBarOpen,
  setCtrl,
  setIsOpenMainSidebar,
  selectSelectedType,
} from "@app/global";
import Loading from "@components/common/Loading";
import { imageResizer } from "@utils/util";

const MoviesList = ({ isVertical, isLoading }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const ctrl = useSelector(selectCtrl);
  const cropHost = useSelector(selectCropHost);
  const selectedType = useSelector(selectSelectedType);
  const { moviesByGenre, dynamicContent } = useContext(MoviesContext);
  const isMovieSearchBarOpen = useSelector(selectIsMovieSearchBarOpen);

  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    if (isMovieSearchBarOpen) {
      dispatch(setCtrl("inp"));
    } else {
      dispatch(setCtrl("moviesSeries"));
    }
  }, [isMovieSearchBarOpen]);

  const currentMovies = selectedType ? moviesByGenre[selectedType] || [] : [];

  useEffect(() => {
    setActiveCategory(0);
  }, [selectedType]);

  useKeydown({
    isActive: ctrl === "moviesSeries" && !isMovieSearchBarOpen,
    // down: () => {
    //   if (!currentMovies?.length) return;

    //   setActiveCategory(Math.min(activeCategory + 1, currentMovies.length - 1));
    // },
    // up: () => {
    //   // if (activeCategory > 0) {
    //   //   setActiveCategory(activeCategory - 1);
    //   // } else {
    //   //   if (selectedType === "movie" || selectedType === "tv_show") {
    //   //     dispatch(setCtrl("backBtn"));
    //   //   }
    //   // }
    //   dispatch(setCtrl("backBtn"));
    // },
  });

  const renderMovieCard = useCallback(
    ({ index, style, isActive, item }) => {
      return (
        <MovieCard
          id={item.id}
          key={item.id}
          style={style}
          isActive={isActive}
          name={
            item.movie_translation ? item.movie_translation.name : item.name
          }
          poster={`${imageResizer(cropHost, item.poster, 200, 300, "0", "jpg")}`}
          isVertical={isVertical}
        />
      );
    },
    [isVertical, cropHost],
  );

  return (
    <>
      {isLoading ? (
        <div className={styles["loading-container"]}>
          <Loading />
        </div>
      ) : (
        <>
          {selectedType === "movie" || selectedType === "tv_show" ? (
            <>
              {currentMovies && currentMovies.length && !isLoading ? (
                <div className={styles["movies-list"]}>
                  <ListGridView
                    id="movies-grid"
                    data={currentMovies}
                    rowsCount={currentMovies.length}
                    visibleRowsCount={1}
                    itemWidth={20}
                    itemHeight={30}
                    withTitle={true}
                    buffer={3}
                    debounce={200}
                    onFirstRow={({ key }) => {
                      console.log(key, "keeey");
                      if (key === "up") {
                        dispatch(setCtrl("backBtn"));
                      } else {
                        navigate("/menu");
                      }
                    }}
                    gap={2}
                    rowGap={10}
                    isActive={ctrl === "moviesSeries"}
                    renderItem={renderMovieCard}
                    onLeft={() => {
                      dispatch(setCtrl("mainSidebar"));
                      dispatch(setIsOpenMainSidebar(true));
                    }}
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
          ) : dynamicContent && dynamicContent.length ? (
            <div className={styles["movies-list"]}>
              <GridView
                id="gridview-1"
                uniqueKey="gridview-1"
                isActive={ctrl === "moviesSeries"}
                data={dynamicContent}
                itemWidth={isVertical ? 35 : 20}
                itemHeight={isVertical ? 20 : 27}
                scrollOffset={10}
                gap={1}
                rowGap={4}
                onUp={() => {
                  dispatch(setCtrl("backBtn"));
                }}
                onLeft={() => {
                  dispatch(setCtrl("mainSidebar"));
                  dispatch(setIsOpenMainSidebar(true));
                }}
                bufferStart={10}
                bufferEnd={10}
                nativeControle={true}
                renderItem={({ index, style, isActive, item }) => {
                  return (
                    <div className={styles["category-wrapper"]}>
                      {renderMovieCard({ index, style, isActive, item })}
                    </div>
                  );
                }}
              />
            </div>
          ) : (
            <>
              <InoButton
                classNames={styles["no-content_button"]}
                size="large"
                isActive={ctrl === "moviesSeries"}
                onLeft={() => {
                  dispatch(setCtrl("mainSidebar"));
                  dispatch(setIsOpenMainSidebar(true));
                }}
                onClick={() => {
                  dispatch(setCtrl("inp"));
                  dispatch(setIsOpenMainSidebar(false));
                  dispatch(setIsMovieSearchBarOpen(true));
                }}
              >
                {t("Search")}
              </InoButton>
            </>
          )}
        </>
      )}
    </>
  );
};

export default React.memo(MoviesList);
