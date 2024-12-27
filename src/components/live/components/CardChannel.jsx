import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import iconFavorite from "@assets/images/live/favorite.png";
import iconLock from "@assets/images/live/lock.png";
import iconPremium from "@assets/images/live/premium.png";

export default memo(function CardChannel({
  isActive,
  elem,
  onClick,
  index,
  isSelected,
  style,
}) {
  // console.log(elem, "elemelemelemelem");
  return (
    <div
      className={`card-channel${isActive ? " active" : ""}${isSelected ? " selected" : ""}`}
      onClick={() => {
        console.log(elem.id, "alksdmvlaksdmvlkm");
        onClick(index, elem.id);
      }}
      style={style}
    >
      <div className="number">#{elem.position}</div>
      <img
        className="icon"
        src={elem.image}
        alt="elem.name"
        onError={
          LOCAL_STORAGE.LOGO.GET()
            ? (e) => (e.target.src = LOCAL_STORAGE.LOGO.GET())
            : null
        }
      />
      <p className="name">{elem.name}</p>

      <div className="icons">
        {/* {elem.is_favorite ? <img src={iconFavorite} alt="" /> : null} */}
        {elem.is_protected ? <img src={iconLock} alt="" /> : null}
        {!elem.canWatch ? <img src={iconPremium} alt="" /> : null}
      </div>
    </div>
  );
});
