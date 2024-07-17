import { memo } from "react";
import "./styles/button.scss";

const Button = ({
  className = "",
  index,
  onClick,
  onMouseEnter,
  title,
  isActive,
}) => {
  return (
    <button
      className={`button ${className}${isActive ? " active" : ""}`}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter(index)}
    >
      {title}
    </button>
  );
};

export default memo(Button);
