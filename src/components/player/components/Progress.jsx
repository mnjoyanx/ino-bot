import { memo, useCallback } from "react";

export default memo(function Progress({
  color = "white",
  placeholderColor = "#242424",
  refProgress,
  playerType = "",
  refVal = null,
  classNames = "",
  currentTime = 100,
}) {
  const styleProgress = {
    backgroundColor: placeholderColor,
    width: `100%`,
  };

  const styleProgressBar = {
    backgroundColor: color,
    width: `${100}%`,
  };

  return (
    <div className={`progress ${classNames}`} style={styleProgress}>
      <div
        className={`progress-bar ${playerType}`}
        style={styleProgressBar}
        // ref={refProgress}
      >
        <div className="seekto-current_time" ref={refVal}></div>
      </div>
    </div>
  );
});
