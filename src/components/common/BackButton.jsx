import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCtrl } from "@app/global";
import useKeydown from "@hooks/useKeydown";
import SvgBack from "@assets/icons/SvgBack";
import { useTranslation } from "react-i18next";
const BackButton = ({ path, onDownHandler, onOkHandler, onBackHandler }) => {
  const navigate = useNavigate();
  const ctrl = useSelector(selectCtrl);
  const { t } = useTranslation();

  useKeydown({
    isActive: ctrl === "backBtn",
    ok: () => {
      if (onOkHandler) {
        onOkHandler();
      } else {
        navigate(-1);
      }
    },
    down: () => onDownHandler(),
    back: () => {
      if (onBackHandler) {
        onBackHandler();
      }
    },
  });

  return (
    <button
      onClick={() => navigate(-1)}
      className={ctrl === "backBtn" ? "back-button active" : "back-button"}
    >
      <SvgBack />
      {path && <p className="back-button-text">{t("Back")}</p>}
    </button>
  );
};

export default BackButton;
