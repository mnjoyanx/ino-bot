import { createContext, useReducer, useContext, useState } from "react";

export const MoviesContext = createContext();

const initialState = {
  moviesByGenre: {},
};

function moviesReducer(state, action) {
  switch (action.type) {
    case "SET_MOVIES_BY_GENRE":
      return {
        ...state,
        moviesByGenre: {
          ...state.moviesByGenre,
          [action.payload.genreId]: action.payload.movies,
        },
      };
    default:
      return state;
  }
}

export const MoviesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(moviesReducer, initialState);
  const [selectedGenre, setSelectedGenre] = useState(null);

  const setMoviesByGenre = (genreId, movies) => {
    dispatch({
      type: "SET_MOVIES_BY_GENRE",
      payload: { genreId, movies },
    });

    setSelectedGenre(genreId);
  };

  return (
    <MoviesContext.Provider
      value={{
        moviesByGenre: state.moviesByGenre,
        setMoviesByGenre,
        selectedGenre,
        setSelectedGenre,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
};

export const useMovies = () => useContext(MoviesContext);
