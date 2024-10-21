import { memo } from "react";

export default memo(function Progress({
  color = "white",
  placeholderColor = "#242424",
  refProgress,
  playerType = "",
  refVal = null,
  classNames = "",
}) {
  const styleProgress = {
    backgroundColor: placeholderColor,
  };

  const styleProgressBar = {
    backgroundColor: color,
  };

  return (
    <div className={`progress ${classNames}`} style={styleProgress}>
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
