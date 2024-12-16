import { useCallback } from "react";

export const useMovieKeyboardNavigation = ({
  ctrl,
  activeButton,
  setActiveButton,
  navigate,
  handleWatchClick,
  handleContinueWatchingClick,
  handleFavoriteClick,
  movie,
}) => {
  return useCallback(
    {
      isActive: ctrl === "movieInfo",

      left: () => {
        if (activeButton > 0) {
          setActiveButton(activeButton - 1);
        }
      },
      right: () => {
        if (activeButton < 2) {
          setActiveButton(activeButton + 1);
        }
      },
      ok: () => {
        switch (activeButton) {
          case 0:
            if (movie?.canWatch) handleWatchClick();
            break;
          case 1:
            handleContinueWatchingClick();
            break;
          case 2:
            handleFavoriteClick();
            break;
        }
      },
      back: () => {
        navigate(-1);
      },
    },
    [
      ctrl,
      activeButton,
      setActiveButton,
      navigate,
      handleWatchClick,
      handleContinueWatchingClick,
      handleFavoriteClick,
      movie,
    ]
  );
};
