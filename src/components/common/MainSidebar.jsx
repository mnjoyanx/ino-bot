import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  selectCtrl,
  selectIsOpenMainSidebar,
  setIsOpenMainSidebar,
} from "@app/global";
import SvgSearch from "@assets/icons/SvgSearch";
import SvgFavorites from "@assets/icons/SvgFavorite";
import SvgLastWatched from "@assets/icons/SvgLastWatched";
import SvgRecentlyAdded from "@assets/icons/SvgRecentlyAdded";
import SvgGenres from "@assets/icons/SvgGenres";
import AppLogo from "./AppLogo";

import styles from "@styles/components/mainSidebar.module.scss";
import useKeydown from "../../hooks/useKeydown";
import { setCtrl } from "../../app/global";

const MainSidebar = ({ categories }) => {
  const dispatch = useDispatch();

  const isOpen = useSelector(selectIsOpenMainSidebar);
  const ctrl = useSelector(selectCtrl);

  const [sidebarItems, setSidebarItems] = useState([]);
  const [active, setActive] = useState(0);
  const [isCategoriesOpened, setIsCategoriesOpened] = useState(false);

  const items = [
    {
      name: "Search",
      icon: <SvgSearch />,
    },
    {
      name: "Favorites",
      icon: <SvgFavorites />,
    },
    {
      name: "Last Watched",
      icon: <SvgLastWatched />,
    },
    {
      name: "Recently Added",
      icon: <SvgRecentlyAdded />,
    },
  ];

  useEffect(() => {
    if (categories) {
      setSidebarItems([
        ...items,
        {
          name: "Genres",
          icon: <SvgGenres />,
          items: categories,
        },
      ]);
    }
  }, [categories]);

  useKeydown({
    isActive: isOpen && ctrl === "mainSidebar",

    right: () => {
      dispatch(setIsOpenMainSidebar(false));
      dispatch(setCtrl("moviesSeries"));
    },

    up: () => {
      if (active > 0) setActive(active - 1);
    },
    down: () => {
      if (active < sidebarItems.length - 1) setActive(active + 1);
    },

    ok: () => {
      if (active === sidebarItems.length - 1 && sidebarItems[active].items) {
        setIsCategoriesOpened(!isCategoriesOpened);
        dispatch(setCtrl("movieCategories"));
      }
    },
  });

  return (
    <div
      className={`${styles["main-sidebar"]} ${isOpen ? styles["open"] : ""}`}
    >
      <div className={styles["outline"]}></div>
      <div
        className={`${styles["items"]} ${isCategoriesOpened ? styles["categories-opened"] : ""}`}
      >
        {sidebarItems.map((item, index) => {
          return (
            <div
              className={`${styles["item"]} ${active === index ? styles["active"] : ""} ${item.items ? styles["parent"] : ""}`}
              key={index}
            >
              <div className={styles["icon"]}>{item.icon}</div>
              <p className={styles["text"]}>{item.name}</p>
              {isCategoriesOpened && item.items ? (
                <CategoriesList
                  categories={item.items}
                  isOpen={isCategoriesOpened}
                  setIsOpen={setIsCategoriesOpened}
                  ctrl={ctrl}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CategoriesList = ({ categories, isOpen, setIsOpen, ctrl }) => {
  const dispatch = useDispatch();

  const [catActive, setCatActive] = useState(0);

  useKeydown({
    isActive: isOpen && ctrl === "movieCategories",

    up: () => {
      if (catActive > 0) {
        setCatActive(catActive - 1);
      } else {
        dispatch(setCtrl("mainSidebar"));
        setIsOpen(false);
      }
    },
    down: () => {
      if (catActive < categories.length - 1) {
        setCatActive(catActive + 1);
      }
    },
  });
  return (
    <div className={styles["categories"]}>
      {categories.map((category, idx) => {
        return (
          <p
            key={idx}
            className={`${styles["name"]} ${idx === catActive ? styles["active"] : ""}`}
          >
            {category.name}
          </p>
        );
      })}
    </div>
  );
};

export default MainSidebar;
