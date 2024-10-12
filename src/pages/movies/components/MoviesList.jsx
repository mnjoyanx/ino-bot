import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl } from "@app/global";
import LIstView from "@components/lists/LIstView";
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

  return (
    <div
      className={`${styles["movies-list"]} ${activeRow > 0 ? styles["up"] : ""}`}
    >
      {Object.keys(movies).map((movie, index) => {
        return (
          <div key={index} className={styles["wrapper"]}>
            <h2 className={styles["movies-list_title"]}>
              {movie === "tv_show" ? "Series" : "Movies"}
            </h2>
            <LIstView
              id="movie_list"
              uniqueKey={"movies-cast-list"}
              itemsTotal={movies[movie].length}
              itemsCount={2}
              listType="horizontal"
              itemWidth={24}
              itemHeight={27}
              isActive={activeRow === index && ctrl === "moviesSeries"}
              activeCol={activeColumn}
              ItemRenderer={MovieCard}
              buffer={5}
              debounce={100}
              nativeControle={true}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MoviesList;
