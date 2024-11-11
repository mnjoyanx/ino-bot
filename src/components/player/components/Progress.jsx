import { memo, useCallback } from "react";

export default memo(function Progress({
  color = "white",
  placeholderColor = "#242424",
  refProgress,
  playerType = "",
  refVal = null,
  classNames = "",
  duration = 0,
  currentTime = 0,
  onSeekTo,
}) {
  const styleProgress = {
    backgroundColor: placeholderColor,
  };

  const styleProgressBar = {
    backgroundColor: color,
    width: `${currentTime}px`,
  };

  const handleProgressClick = useCallback(
    (e) => {
      if (!duration || !onSeekTo) return;

      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const progressWidth = rect.width;
      const seekPercentage = clickPosition / progressWidth;
      const seekTime = seekPercentage * duration;

      onSeekTo(seekTime);
    },
    [duration, onSeekTo],
  );

  return (
    <div
      className={`progress ${classNames}`}
      style={styleProgress}
      onClick={handleProgressClick}
    >
      <div
        className={`progress-bar ${playerType}`}
        style={styleProgressBar}
        ref={refProgress}
      >
        <div className="seekto-current_time" ref={refVal}></div>
      </div>
    </div>
  );
});
