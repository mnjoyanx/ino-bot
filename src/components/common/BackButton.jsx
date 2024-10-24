import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCtrl } from "@app/global";
import useKeydown from "@hooks/useKeydown";
import SvgBack from "@assets/icons/SvgBack";

const BackButton = ({ path, onDownHandler }) => {
  const navigate = useNavigate();
  const ctrl = useSelector(selectCtrl);

  useKeydown({
    isActive: ctrl === "backBtn",
    ok: () => navigate(-1),
    down: () => onDownHandler(),
  });

  return (
    <button
      onClick={() => navigate(-1)}
      className={ctrl === "backBtn" ? "back-button active" : "back-button"}
    >
      <SvgBack />
      {path && <p className="back-button-text">{path}</p>}
    </button>
  );
};

export default BackButton;
