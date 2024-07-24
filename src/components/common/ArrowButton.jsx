import SvgArrow from "@assets/images/live/SvgArrow";

import "./styles/ArrowButton.scss";

export default function ArrowButton({ onClick, type = "down" }) {
  return (
    <div className={`arrow-button ${type}`} onClick={onClick}>
      <SvgArrow />
    </div>
  );
}
