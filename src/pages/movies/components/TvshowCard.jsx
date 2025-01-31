import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "@styles/components/tvshowCard.module.scss";
import useKeydown from "@hooks/useKeydown";
import { setCtrl } from "@app/global";
import { useDispatch } from "react-redux";

const TvshowCard = React.memo(({ style, isActive, name, poster, id }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleNavigation = useCallback(() => {
    navigate(`/tvshow/${id}`);
    dispatch(setCtrl("tvshowInfo"));
  }, [navigate, id, dispatch]);

  useKeydown({
    isActive,
    ok: handleNavigation,
  });

  return (
    <div
      style={style}
      className={`${styles["tvshow-card_parent"]} ${isActive ? styles["active"] : ""}`}
      onClick={handleNavigation}
    >
      <div className={styles["tvshow-card"]}>
        <img src={poster} alt={name} />
      </div>
      <p className={`${styles["title"]} one-line`}>{name}</p>
    </div>
  );
});

export default TvshowCard;
