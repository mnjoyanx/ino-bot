import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCtrl,
  setCtrl,
  selectIsProtectedModalOpen,
  setIsProtectedModalOpen,
} from "@app/global";
import Button from "@components/common/Button";
import SvgPlay from "@assets/icons/SvgPlay.jsx";
import SvgFav from "@assets/icons/SvgFav";
import SvgFavFill from "@assets/icons/SvgFavFill";
import useKeydown from "@hooks/useKeydown";
import { useMovieActions } from "../hooks/useMovieActions";
import styles from "@styles/components/movieInfo.module.scss";
import { useMovieInfo } from "@context/movieInfoContext";
import { formatTime } from "@utils/util";
import { InoProtectInput, Modal, toast } from "@ino-ui/tv";

const MovieActions = ({ movie, movieId, currentEpisode, isPlayerOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isProtectedModalOpen = useSelector(selectIsProtectedModalOpen);
  const [activeButton, setActiveButton] = useState(0);
  const ctrl = useSelector(selectCtrl);
  const [isShowProtected, setIsShowProtected] = useState(false);
  const { setUrl, movieInfo, setMovieInfo, setStartTime } = useMovieInfo();
  const { handleWatchClick, handleContinueWatchingClick, handleFavoriteClick } =
    useMovieActions(
      movieId,
      setUrl,
      movieInfo.type,
      movieInfo.watched?.episodeId || currentEpisode,
      setMovieInfo,
      movieInfo.favorite,
      movieInfo.watched?.time || 0,
      setStartTime,
    );

  const [clickByWatch, setClickByWatch] = useState(true);

  useKeydown({
    isActive: ctrl === "movieInfo",
    left: () => {
      if (movie.watched) {
        setActiveButton((prev) => Math.max(0, prev - 1));
      } else {
        setActiveButton(0);
      }
    },
    right: () => {
      if (movie.watched) {
        setActiveButton((prev) => Math.min(2, prev + 1));
      } else {
        setActiveButton(2);
      }
    },
    down: () => {
      if (movie.type !== "tv_show") return;

      dispatch(setCtrl("seasons"));
    },
    ok: () => {
      switch (activeButton) {
        case 0:
          setClickByWatch(true);
          if (movie?.is_protected) {
            setIsShowProtected(true);
            dispatch(setCtrl("protected"));
          } else {
            handleWatchClick();
          }
          break;
        case 1:
          setClickByWatch(false);
          if (movie.is_protected) {
            setIsShowProtected(true);
            dispatch(setCtrl("protected"));
          } else {
            setStartTime(movie.watched.time);
            handleContinueWatchingClick();
          }
          break;
        case 2:
          handleFavoriteClick();
          break;
      }
    },
    back: () => navigate(-1),
  });

  const localParentalCode = localStorage.getItem("parental_code");
  const parentalCode = localParentalCode ? JSON.parse(localParentalCode) : null;

  return (
    <>
      <Modal
        isOpen={isShowProtected || isProtectedModalOpen}
        onClose={() => {
          dispatch(setIsProtectedModalOpen(false));
          setIsShowProtected(false);
          dispatch(setCtrl("movieInfo"));
        }}
        onCancel={() => {}}
        onOk={() => {}}
        size="full"
      >
        <InoProtectInput
          isActive={ctrl === "protected"}
          count={4}
          isOpenKeyboard={true}
          onChange={(value) => {}}
          onComplete={(value) => {
            if (value === parentalCode) {
              dispatch(setIsProtectedModalOpen(false));
              setIsShowProtected(false);
              handleWatchClick(clickByWatch ? true : false);
            } else {
              toast.error("Invalid parental code");
            }
          }}
        />
      </Modal>
      <div
        className={`${styles["actions-container"]} ${
          window.Android && isPlayerOpen ? styles["hidden"] : ""
        }`}
      >
        {movie.canWatch && (
          <Button
            className={styles["action-btn"]}
            onClick={() => {
              setClickByWatch(true);
              if (movie.is_protected) {
                setIsShowProtected(true);
                dispatch(setCtrl("protected"));
              } else {
                handleWatchClick();
              }
            }}
            onMouseEnter={() => setActiveButton(0)}
            title="Watch"
            isActive={activeButton === 0 && ctrl === "movieInfo"}
            icon={<SvgPlay />}
          />
        )}
        {movie.watched ? (
          <Button
            className={styles["action-btn"]}
            onClick={() => {
              setClickByWatch(false);
              if (movie.is_protected) {
                setIsShowProtected(true);
                dispatch(setCtrl("protected"));
              } else {
                setStartTime(movie.watched.time);
                handleContinueWatchingClick();
              }
            }}
            onMouseEnter={() => setActiveButton(1)}
            title={formatTime(movie.watched.time)}
            isActive={activeButton === 1 && ctrl === "movieInfo"}
          />
        ) : null}
        <Button
          className={styles["action-btn"]}
          onClick={handleFavoriteClick}
          onMouseEnter={() => setActiveButton(2)}
          isActive={activeButton === 2 && ctrl === "movieInfo"}
          icon={movie.favorite ? <SvgFavFill /> : <SvgFav />}
        />
      </div>
    </>
  );
};

export default MovieActions;
