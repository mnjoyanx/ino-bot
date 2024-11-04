import {
  createContext,
  useReducer,
  useState,
  useMemo,
  useCallback,
} from "react";

export const MoviesContext = createContext();

const initialState = {
  moviesByGenre: {},
  genres: [],
  recentlyAdded: [],
  lastWatched: [],
  favorites: [],
  menuList: [],
  rowsCount: 0,
};

const filterMoviesAndSeries = (movies, genres) => {
  const genreMovies = genres.filter((genre) => {
    return movies.some((movie) => movie.genres.some((g) => g.id === genre.id));
  });

  const moviesByGenre = genreMovies.map((genre) => {
    return {
      ...genre,
      list: movies.filter((movie) =>
        movie.genres.some((g) => g.id === genre.id),
      ),
    };
  });

  return moviesByGenre;
};

function moviesReducer(state, action) {
  switch (action.type) {
    case "SET_MOVIES_BY_GENRE":
      if (!Array.isArray(action.payload.movies)) {
        console.error("SET_MOVIES_BY_GENRE payload.movies must be an array");
        return state;
      }
      return {
        ...state,
        moviesByGenre: {
          ...state.moviesByGenre,
          [action.payload.type]: filterMoviesAndSeries(
            action.payload.movies,
            state.genres,
          ),
        },
      };
    case "SET_GENRES":
      return {
        ...state,
        genres: action.payload,
      };
    case "SET_MENU_LIST":
      return {
        ...state,
        menuList: action.payload,
      };
    default:
      return state;
  }
}

export const MoviesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(moviesReducer, initialState);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const setMoviesByGenre = useCallback((type, movies) => {
    dispatch({
      type: "SET_MOVIES_BY_GENRE",
      payload: { type, movies },
    });
  }, []);

  const setRecentlyAddedHandler = useCallback((movies) => {
    setRecentlyAdded(movies);
  }, []);

  const setGenres = useCallback((genres) => {
    dispatch({
      type: "SET_GENRES",
      payload: genres,
    });
  }, []);

  const setMenuList = useCallback((menuList) => {
    dispatch({
      type: "SET_MENU_LIST",
      payload: menuList,
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      moviesByGenre: state.moviesByGenre,
      genres: state.genres,
      setMoviesByGenre,
      setGenres,
      selectedGenre,
      setSelectedGenre,
      selectedType,
      setSelectedType,
      menuList: state.menuList,
      setMenuList,
    }),
    [
      state.moviesByGenre,
      state.genres,
      selectedGenre,
      setMoviesByGenre,
      setGenres,
      state.menuList,
      setSelectedType,
      selectedType,
    ],
  );

  return (
    <MoviesContext.Provider value={contextValue}>
      {children}
    </MoviesContext.Provider>
  );
};
