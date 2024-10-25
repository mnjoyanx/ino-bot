import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setIsPlayerOpen, setCtrl } from "@app/global";
import { setPlayerType } from "@app/channels/channelsSlice";
import { getMovieUrl } from "@server/requests";
import { useToast } from "@hooks/useToast";
import { useMovieInfo } from "@context/movieInfoContext";

export const useSeasonEpisodeActions = (seriesId) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { setUrl } = useMovieInfo();

  const handleEpisodeClick = useCallback(
    async (episodeId) => {
      try {
        const response = await getMovieUrl({
          id: seriesId,
          episode_id: episodeId,
        });
        const parsedResponse = JSON.parse(response);
        if (!parsedResponse.error) {
          dispatch(setIsPlayerOpen(true));
          dispatch(setPlayerType("vod"));
          dispatch(setCtrl("vodCtrl"));
          setUrl("");
          setUrl(parsedResponse.message.stream_url);
        } else {
          showToast("Failed to load episode", "error", 3000);
        }
      } catch (error) {
        console.error("Failed to load episode:", error);
        showToast("Error loading episode", "error", 3000);
      }
    },
    [seriesId, dispatch, setUrl, showToast]
  );

  const handleSeasonChange = useCallback((seasonNumber) => {
    console.log("Season changed:", seasonNumber);
    // Implement logic for changing seasons, e.g., fetching episodes for the new season
  }, []);

  return { handleEpisodeClick, handleSeasonChange };
};
