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
import { useTranslation } from "react-i18next";

const MovieActions = ({ movie, movieId, currentEpisode, isPlayerOpen }) => {
  const customKeyboard = [
    [
      { label: 1, value: 1 },
      { label: 2, value: 2 },
      { label: 3, value: 3 },
    ],
    [
      { label: 4, value: 4 },
      { label: 5, value: 5 },
      { label: 6, value: 6 },
    ],
    [
      { label: 7, value: 7 },
      { label: 8, value: 8 },
      { label: 9, value: 9 },
    ],
    [
      { label: 0, value: "0" },
      {
        label: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            width="24"
            height="24"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <path
                d="M12.0004 9.5L17.0004 14.5M17.0004 9.5L12.0004 14.5M4.50823 13.9546L7.43966 17.7546C7.79218 18.2115 7.96843 18.44 8.18975 18.6047C8.38579 18.7505 8.6069 18.8592 8.84212 18.9253C9.10766 19 9.39623 19 9.97336 19H17.8004C18.9205 19 19.4806 19 19.9084 18.782C20.2847 18.5903 20.5907 18.2843 20.7824 17.908C21.0004 17.4802 21.0004 16.9201 21.0004 15.8V8.2C21.0004 7.0799 21.0004 6.51984 20.7824 6.09202C20.5907 5.71569 20.2847 5.40973 19.9084 5.21799C19.4806 5 18.9205 5 17.8004 5H9.97336C9.39623 5 9.10766 5 8.84212 5.07467C8.6069 5.14081 8.38579 5.2495 8.18975 5.39534C7.96843 5.55998 7.79218 5.78846 7.43966 6.24543L4.50823 10.0454C3.96863 10.7449 3.69883 11.0947 3.59505 11.4804C3.50347 11.8207 3.50347 12.1793 3.59505 12.5196C3.69883 12.9053 3.96863 13.2551 4.50823 13.9546Z"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>{" "}
            </g>
          </svg>
        ),
        value: "delete",
        action: "delete",
        width: 14.5,
      },
    ],
  ];

  const { t } = useTranslation();
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
        classNames="ino-modal_parent"
      >
        <InoProtectInput
          isActive={ctrl === "protected"}
          count={4}
          isOpenKeyboard={true}
          customType={customKeyboard}
          onChange={(value) => {}}
          onComplete={(value) => {
            if (value === parentalCode) {
              dispatch(setIsProtectedModalOpen(false));
              setIsShowProtected(false);
              handleWatchClick(clickByWatch ? true : false);
            } else {
              toast.error(t("Invalid parental code"));
            }
          }}
          clearOnComplete={true}
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
            title={t("Watch")}
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
