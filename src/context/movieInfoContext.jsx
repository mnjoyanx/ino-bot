import React, { createContext, useState, useContext } from "react";

const MovieInfoContext = createContext();

export const MovieInfoProvider = ({ children }) => {
  const [url, setUrl] = useState(null);
  const [activeSeason, setActiveSeason] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [nextEpisode, setNextEpisode] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [isLastEpisode, setIsLastEpisode] = useState(false);
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);

  const value = {
    url,
    setUrl,
    activeSeason,
    setActiveSeason,
    selectedSeason,
    setSelectedSeason,
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
    activeEpisode,
    setActiveEpisode,
    activeSeasonIndex,
    setActiveSeasonIndex,
  };

  return (
    <MovieInfoContext.Provider value={value}>
      {children}
    </MovieInfoContext.Provider>
  );
};

export const useMovieInfo = () => useContext(MovieInfoContext);
