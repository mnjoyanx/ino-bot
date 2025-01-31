import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";
import FavActiveSvg from "@assets/icons/FavActiveSvg";

import "./Cards.scss";

export default memo(function CardChannel({
  image,
  id,
  isActive,
  className = "",
  index,
  onClick,
  style,
  isFavorite,
  elem,
}) {
  const handleClick = () => {
    if (onClick && typeof id !== "undefined" && typeof index !== "undefined") {
      console.log(id, index, "idindex");
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
        {isFavorite && (
          <div className="favorite-icon">
            <FavActiveSvg isActive={true} />
          </div>
        )}
      </div>
    </div>
  );
});
