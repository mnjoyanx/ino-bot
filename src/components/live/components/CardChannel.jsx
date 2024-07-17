import { memo } from "react";

import LOCAL_STORAGE from "@utils/localStorage";

import iconFavorite from "@assets/images/live/favorite.png";
import iconLock from "@assets/images/live/lock.png";
import iconPremium from "@assets/images/live/premium.png";

export default memo(function CardChannel({ isActive, elem, onClick, index }) {
  return (
    <div
      className={`card-channel${isActive ? " active" : ""}`}
      onClick={() => onClick(index)}
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
        <img src={iconFavorite} alt="" />
        <img src={iconLock} alt="" />
        <img src={iconPremium} alt="" />
      </div>
    </div>
  );
});
