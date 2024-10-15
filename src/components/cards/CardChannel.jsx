import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import "./Cards.scss";

export default memo(function CardChannel({
  image,
  id,
  isActive,
  className = "",
  index,
  onClick,
  style,
}) {
  const handleClick = () => {
    if (onClick && typeof id !== "undefined" && typeof index !== "undefined") {
      onClick(id, index);
    }
  };

  const handleImageError = (e) => {
    const fallbackLogo = LOCAL_STORAGE.LOGO.GET();
    if (fallbackLogo) {
      e.target.src = fallbackLogo;
    }
  };

  return (
    <div className="main-card_wrapper" style={style}>
      <div
        className={`main-card-channel ${className}${isActive ? " active" : ""}`}
        onClick={handleClick}
      >
        <img src={image} onError={handleImageError} alt="Channel logo" />
      </div>
    </div>
  );
});
