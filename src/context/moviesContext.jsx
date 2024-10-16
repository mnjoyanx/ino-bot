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
};

const filterMoviesAndSeries = (movies) => {
  return movies.reduce(
    (acc, item) => {
      if (item.type === "movie") {
        acc.movies.push(item);
      } else if (item.type === "tv_show") {
        acc.tv_show.push(item);
      }
      return acc;
    },
    { movies: [], tv_show: [] }
  );
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
          [action.payload.genreId]: filterMoviesAndSeries(
            action.payload.movies
          ),
        },
      };
    case "SET_GENRES":
      return {
        ...state,
        genres: action.payload,
      };
    default:
      return state;
  }
}

export const MoviesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(moviesReducer, initialState);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const setMoviesByGenre = useCallback((genreId, movies) => {
    dispatch({
      type: "SET_MOVIES_BY_GENRE",
      payload: { genreId, movies },
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

  const contextValue = useMemo(
    () => ({
      moviesByGenre: state.moviesByGenre,
      genres: state.genres,
      setMoviesByGenre,
      setGenres,
      selectedGenre,
      setSelectedGenre,
    }),
    [
      state.moviesByGenre,
      state.genres,
      selectedGenre,
      setMoviesByGenre,
      setGenres,
    ]
  );

  return (
    <MoviesContext.Provider value={contextValue}>
      {children}
    </MoviesContext.Provider>
  );
};
