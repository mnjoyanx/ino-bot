import { memo } from "react";

export default memo(function Progress({
  percent = 0,
  color = "white",
  placeholderColor = "#242424",
}) {
  const styleProgress = {
    backgroundColor: placeholderColor,
  };

  const styleProgressBar = {
    width: `${percent}%`,
    backgroundColor: color,
  };

  return (
    <div className="progress" style={styleProgress}>
      <div className="progress-bar" style={styleProgressBar}></div>
    </div>
  );
});
