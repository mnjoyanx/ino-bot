import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import "./Cards.scss";

export default memo(function CardChannel({ item, isActive, className = "" }) {
  return (
    <div
      className={`main-card-channel ${className}${isActive ? " active" : ""}`}
    >
      <img
        src={item.image}
        onError={(e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())}
        alt=""
      />
    </div>
  );
});
