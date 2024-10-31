import { useEffect, useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MoviesContext } from "@context/moviesContext";

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
import { ListView } from "ino-ui-tv";

import styles from "@styles/components/mainSidebar.module.scss";
import useKeydown from "@hooks/useKeydown";
import { setCtrl, setIsMovieSearchBarOpen } from "@app/global";

const MainSidebar = ({ categories }) => {
  const dispatch = useDispatch();
  const { setSelectedGenre, menuList } = useContext(MoviesContext);

  const isOpen = useSelector(selectIsOpenMainSidebar);
  const ctrl = useSelector(selectCtrl);

  const [sidebarItems, setSidebarItems] = useState([]);
  const [active, setActive] = useState(0);
  const [isCategoriesOpened, setIsCategoriesOpened] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  const items = [
    {
      name: "Search",
      icon: <SvgSearch />,
    },
    // {
    //   name: "Favorites",
    //   id: "favorites",
    //   icon: <SvgFavorites />,
    // },
    // {
    //   name: "Last Watched",
    //   id: "lastWatched",
    //   icon: <SvgLastWatched />,
    // },
    // {
    //   name: "Recently Added",
    //   id: "recentlyAdded",
    //   icon: <SvgRecentlyAdded />,
    // },
  ];

  useEffect(() => {
    if (categories && menuList) {
      const newItems = [
        ...items,
        ...menuList
          // .filter(
          //   (item) =>
          //     item.type === "movies" ||
          //     item.type === "tv-shows" ||
          //     item.type === "favorites",
          // )
          .map((item) => ({
            name: item.name,
            id: item.id,
            selectedIcon: item.selectedIcon,
            icon: item.icon ? (
              <img
                src={item.icon}
                alt={item.name}
                className={styles["main-sidebar-item_icon"]}
              />
            ) : (
              <SvgGenres />
            ),
          })),
        {
          name: "Genres",
          icon: <SvgGenres />,
          items: categories,
        },
      ];

      setSidebarItems(newItems);
    }
  }, [categories, menuList]);

  useKeydown({
    isActive: isOpen && ctrl === "mainSidebar",

    right: () => {
      dispatch(setIsOpenMainSidebar(false));
      dispatch(setCtrl("moviesSeries"));
    },

    up: () => {
      if (active > 0) {
        setActive(active - 1);
        // if (sidebarItems.length > 6) {
        if (active < 6) {
          setTranslateY((prev) => Math.min(prev + 8, 0));
        }
        // }
      }
    },
    down: () => {
      if (active < sidebarItems.length - 1) {
        setActive(active + 1);
        if (active > 2) {
          setTranslateY((prev) =>
            Math.max(prev - 8, -((sidebarItems.length - 1) * 8) + 6),
          );
        }
      }
    },

    ok: () => {
      if (active === sidebarItems.length - 1 && sidebarItems[active].items) {
        setIsCategoriesOpened(!isCategoriesOpened);
        dispatch(setCtrl("movieCategories"));
      } else if (active === 0) {
        dispatch(setCtrl("inp"));
        dispatch(setIsOpenMainSidebar(false));
        dispatch(setIsMovieSearchBarOpen(true));
      } else {
        handleCategorySelect(sidebarItems[active].id);
        dispatch(setIsOpenMainSidebar(false));
      }
    },

    back: () => {
      dispatch(setIsOpenMainSidebar(false));
      dispatch(setCtrl("moviesSeries"));
      setIsCategoriesOpened(false);
    },
  });

  const handleCategorySelect = (categoryId) => {
    setSelectedGenre(categoryId);
    setIsCategoriesOpened(false);
    dispatch(setIsOpenMainSidebar(false));
    dispatch(setCtrl("moviesSeries"));
  };

  return (
    <div
      className={`${styles["main-sidebar"]} ${isOpen ? styles["open"] : ""}`}
    >
      <div className={styles["outline"]}></div>

      <div
        className={`${styles["sidebar-items_wrapper"]} ${sidebarItems.length > 3 ? styles["hidden"] : ""}`}
      >
        <div
          className={`${styles["items"]} ${isCategoriesOpened ? styles["categories-opened"] : ""}`}
          style={{ transform: `translateY(${translateY}rem)` }}
        >
          {sidebarItems.map((item, index) => {
            return (
              <div
                className={`${styles["item"]} ${active === index ? styles["active"] : ""} ${item.items ? styles["parent"] : ""}`}
                key={index}
              >
                <div className={styles["icon"]}>
                  {active === index && item.selectedIcon ? (
                    <img
                      src={item.selectedIcon}
                      alt={item.name}
                      className={styles["selected-icon"]}
                    />
                  ) : (
                    item.icon
                  )}
                </div>
                <p className={styles["text"]}>{item.name}</p>
                {isCategoriesOpened && item.items ? (
                  <CategoriesList
                    categories={item.items}
                    isOpen={isCategoriesOpened}
                    setIsOpen={setIsCategoriesOpened}
                    ctrl={ctrl}
                    selectedIcon={item.selectedIcon}
                    onSelectCategory={handleCategorySelect}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CategoriesList = ({
  categories,
  isOpen,
  setIsOpen,
  ctrl,
  onSelectCategory,
  selectedIcon,
}) => {
  const dispatch = useDispatch();

  const [catActive, setCatActive] = useState(0);

  const [translateY, setTranslateY] = useState(0);

  useKeydown({
    isActive: isOpen && ctrl === "movieCategories",

    up: () => {
      if (catActive > 0) {
        setCatActive(catActive - 1);
        setTranslateY((prev) => Math.min(prev + 2.8, 0)); // Limit upward translation
      } else {
        dispatch(setCtrl("mainSidebar"));
        setIsOpen(false);
      }
    },
    down: () => {
      if (catActive < categories.length - 1) {
        setCatActive(catActive + 1);
        if (catActive >= 3) {
          setTranslateY((prev) =>
            Math.max(prev - 2.8, -((categories.length - 1) * 2.8) + 6),
          );
        }
      }
    },

    ok: () => {
      onSelectCategory(categories[catActive].id);
    },

    back: () => {
      dispatch(setCtrl("mainSidebar"));
      setIsOpen(false);
    },
  });

  return (
    <div className={styles["categories"]}>
      <div
        className={styles["categories-list_wrapper"]}
        style={{ transform: `translateY(${translateY}rem)` }}
      >
        {!categories.length ? (
          <p>No Categories</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default MainSidebar;
