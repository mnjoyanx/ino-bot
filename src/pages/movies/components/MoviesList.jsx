import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl } from "@app/global";
import ListView from "@components/lists/ListView";
import useKeydown from "@hooks/useKeydown";
import MovieCard from "./MovieCard";

import styles from "@styles/components/moviesList.module.scss";
import { setCtrl, setIsOpenMainSidebar } from "../../../app/global";

const MoviesList = ({ movies }) => {
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);

  const [activeRow, setActiveRow] = useState(0);
  const [activeColumn, setActiveColumn] = useState(0);

  useKeydown({
    isActive: ctrl === "moviesSeries",

    up: () => {
      if (activeRow > 0) setActiveRow(activeRow - 1);
    },

    down: () => {
      if (activeRow < Object.keys(movies).length - 1)
        setActiveRow(activeRow + 1);
    },

    left: () => {
      if (activeColumn > 0) {
        setActiveColumn(activeColumn - 1);
      } else {
        dispatch(setCtrl("mainSidebar"));
        dispatch(setIsOpenMainSidebar(true));
      }
    },

    right: () => {
      if (
        activeColumn <
        Object.keys(movies[Object.keys(movies)[activeRow]]).length - 1
      ) {
        setActiveColumn(activeColumn + 1);
      }
    },
  });

  const renderMovieCard = ({ index, style, isActive, item }) => (
    <MovieCard
      key={index}
      style={style}
      isActive={isActive}
      name={item.name}
      poster={item.poster}
    />
  );

  return (
    <div
      className={`${styles["movies-list"]} ${activeRow > 0 ? styles["up"] : ""}`}
    >
      {Object.entries(movies).map(([movieType, movieList], index) => (
        <div key={index} className={styles["wrapper"]}>
          <h2 className={styles["movies-list_title"]}>
            {movieType === "tv_show" ? "Series" : "Movies"}
          </h2>
          <ListView
            id="movie_list"
            uniqueKey={`movies-${movieType}-list`}
            itemsTotal={movieList.length}
            itemsCount={2}
            listType="horizontal"
            itemWidth={24}
            itemHeight={27}
            isActive={activeRow === index && ctrl === "moviesSeries"}
            activeCol={activeColumn}
            buffer={5}
            debounce={100}
            nativeControle={true}
            renderItem={renderMovieCard}
            data={movieList}
          />
        </div>
      ))}
    </div>
  );
};

export default MoviesList;
