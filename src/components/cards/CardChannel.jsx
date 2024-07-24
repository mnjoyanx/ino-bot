import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import "./Cards.scss";

export default memo(function CardChannel({
  item,
  isActive,
  className = "",
  index,
  onClick,
}) {
  return (
    <div
      className={`main-card-channel ${className}${isActive ? " active" : ""}`}
      onClick={() => onClick(item.id, index)}
    >
      <img
        src={item.image}
        onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
        alt=""
      />
    </div>
  );
});
