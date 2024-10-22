import React, { createContext, useState, useContext } from "react";

const MovieInfoContext = createContext();

export const MovieInfoProvider = ({ children }) => {
  const [url, setUrl] = useState(null);
  const [nextEpisode, setNextEpisode] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [isLastEpisode, setIsLastEpisode] = useState(false);

  const value = {
    url,
    setUrl,
    nextEpisode,
    setNextEpisode,
    movieInfo,
    setMovieInfo,
    currentEpisode,
    setCurrentEpisode,
    startTime,
    setStartTime,
    isLastEpisode,
    setIsLastEpisode,
  };

  return (
    <MovieInfoContext.Provider value={value}>
      {children}
    </MovieInfoContext.Provider>
  );
};

export const useMovieInfo = () => useContext(MovieInfoContext);
