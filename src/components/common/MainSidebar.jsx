import { useEffect, useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MoviesContext } from "@context/moviesContext";

import {
  selectCtrl,
  selectIsOpenMainSidebar,
  setIsOpenMainSidebar,
  setSelectedType,
} from "@app/global";
import SvgSearch from "@assets/icons/SvgSearch";
import SvgGenres from "@assets/icons/SvgGenres";

import styles from "@styles/components/mainSidebar.module.scss";
import useKeydown from "@hooks/useKeydown";
import {
  setCtrl,
  setIsMovieSearchBarOpen,
  selectSelectedType,
} from "@app/global";

const MainSidebar = ({ categories }) => {
  const dispatch = useDispatch();
  const { menuList } = useContext(MoviesContext);

  const isOpen = useSelector(selectIsOpenMainSidebar);
  const ctrl = useSelector(selectCtrl);
  const selectedType = useSelector(selectSelectedType);
  const [sidebarItems, setSidebarItems] = useState([]);
  const [active, setActive] = useState(0);
  const [isCategoriesOpened, setIsCategoriesOpened] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    {
      name: "Search",
      icon: <SvgSearch />,
    },
  ];

  useEffect(() => {
    if (categories && menuList) {
      const newItems = [
        ...items,
        ...menuList.map((item) => ({
          name: item.name,
          id: item.id,
          selectedIcon: item.selectedIcon,
          type:
            item.type === "movies"
              ? "movie"
              : item.type === "tv-shows"
                ? "tv_show"
                : item.type,
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
      ];

      setSidebarItems(newItems);
    }
  }, [categories, menuList]);

  useEffect(() => {
    if (sidebarItems.length > 0) {
      const foundMovieType = sidebarItems.find((item) => item.type === "movie");

      if (foundMovieType) {
        // setSelectedType(foundMovieType.type);
      } else {
        // setSelectedType(sidebarItems[1].type);
      }
    }
  }, [sidebarItems]);

  useKeydown({
    isActive: isOpen && ctrl === "mainSidebar",

    right: () => {
      dispatch(setIsOpenMainSidebar(false));
      dispatch(setCtrl("moviesSeries"));
    },

    up: () => {
      if (active > 0) {
        setActive(active - 1);
        if (active < 6) {
          setTranslateY((prev) => Math.min(prev + 8, 0));
        }
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
      if (active === 0) {
        dispatch(setCtrl("inp"));
        dispatch(setIsOpenMainSidebar(false));
        dispatch(setIsMovieSearchBarOpen(true));
      } else {
        handleCategorySelect(sidebarItems[active].type);
        dispatch(setIsOpenMainSidebar(false));
      }
    },

    back: () => {
      dispatch(setIsOpenMainSidebar(false));
      dispatch(setCtrl("moviesSeries"));
      setIsCategoriesOpened(false);
    },
  });

  const handleCategorySelect = (type) => {
    // setSelectedType(type);
    dispatch(setSelectedType(type));
    setIsCategoriesOpened(false);
    dispatch(setIsOpenMainSidebar(false));
    dispatch(setCtrl("moviesSeries"));
  };

  useEffect(() => {
    setSelectedItem(selectedType);
  }, [selectedType]);

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
                className={`${styles["item"]} ${active === index ? styles["active"] : ""} ${item.items ? styles["parent"] : ""} ${item.type === selectedItem ? styles["selected"] : ""}`}
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
