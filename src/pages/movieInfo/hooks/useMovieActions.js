import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setIsPlayerOpen, setCtrl } from "@app/global";
import { setPlayerType } from "@app/channels/channelsSlice";
import { getMovieUrl, addFavorite } from "@server/requests";
import { useToast } from "@hooks/useToast";

export const useMovieActions = (id, setUrl) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const handleWatchClick = useCallback(async () => {
    console.log("Watch button clicked");
    const response = await getMovieUrl({ id });
    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.error) {
      dispatch(setIsPlayerOpen(true));
      dispatch(setPlayerType("vod"));
      dispatch(setCtrl("vodCtrl"));
      setUrl(parsedResponse.message.stream_url);
    }
  }, [id, dispatch, setUrl]);

  const handleContinueWatchingClick = useCallback(() => {
    console.log("Continue Watching button clicked");
  }, []);

  const handleFavoriteClick = useCallback(async () => {
    console.log("Favorite button clicked");
    try {
      const response = await addFavorite({ movieId: id });
      const parsedResponse = JSON.parse(response);
      if (!parsedResponse.error) {
        showToast("Movie added to favorites", "success", 3000);
      } else {
        showToast("Failed to add movie to favorites", "error", 3000);
      }
    } catch (error) {
      console.error("Failed to add movie to favorites:", error);
    }
  }, [id, showToast]);

  return { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick };
};
