import React, { createContext, useState, useContext } from "react";

const MovieInfoContext = createContext();

export const MovieInfoProvider = ({ children }) => {
  const [url, setUrl] = useState(null);
  const [nextEpisode, setNextEpisode] = useState(null);

  const value = {
    url,
    setUrl,
    nextEpisode,
    setNextEpisode,
  };

  return (
    <MovieInfoContext.Provider value={value}>
      {children}
    </MovieInfoContext.Provider>
  );
};

export const useMovieInfo = () => useContext(MovieInfoContext);
