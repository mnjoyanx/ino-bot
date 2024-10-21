import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setIsPlayerOpen, setCtrl } from "@app/global";
import { setPlayerType } from "@app/channels/channelsSlice";
import { getMovieUrl, addFavorite } from "@server/requests";
import { useToast } from "@hooks/useToast";
import { removeFavorite } from "../../../server/requests";
import { useMovieInfo } from "../../../context/movieInfoContext";

export const useMovieActions = (
  id,
  setUrl,
  type,
  currentEpisode,
  setMovieInfo,
  isFavorite,
  startTime,
  setStartTime
) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleWatchClick = useCallback(
    async (fromStart = true) => {
      if (!fromStart) {
        setStartTime(startTime);
      } else {
        setStartTime(0);
      }

      const body = { id };
      if (type === "tv_show") {
        body.episode_id = currentEpisode;
      }
      const response = await getMovieUrl(body);
      const parsedResponse = JSON.parse(response);
      if (!parsedResponse.error) {
        dispatch(setIsPlayerOpen(true));
        dispatch(setPlayerType("vod"));
        dispatch(setCtrl("vodCtrl"));
        setUrl(parsedResponse.message.stream_url);
      }
    },
    [id, dispatch, setUrl, setStartTime, startTime]
  );

  const handleContinueWatchingClick = useCallback(() => {
    handleWatchClick(false);
  }, [handleWatchClick]);

  const handleFavoriteClick = useCallback(async () => {
    const body = { movieId: id };

    if (type === "tv_show") {
      body.episodeId = currentEpisode.seasonId;
    }

    setMovieInfo((prev) => ({
      ...prev,
      favorite: !prev.favorite,
    }));

    console.log("movieInfo", isFavorite);
    try {
      let response;
      if (isFavorite) {
        response = await removeFavorite(body);
        console.log("removeFavorite", response);
      } else {
        response = await addFavorite(body);
        console.log("addFavorite", response);
      }
      const parsedResponse = JSON.parse(response);
      if (!parsedResponse.error) {
        showToast("Movie added to favorites", "success", 3000);
      } else {
        showToast("Failed to add movie to favorites", "error", 3000);
      }
    } catch (error) {
      console.error("Failed to add movie to favorites:", error);
    }
  }, [id, showToast, isFavorite]);

  return { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick };
};
