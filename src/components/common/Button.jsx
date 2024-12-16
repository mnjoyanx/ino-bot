import { memo } from "react";
import "./styles/button.scss";

const Button = ({
  className = "",
  index,
  onClick,
  onMouseEnter,
  title,
  isActive,
  icon = null,
}) => {
  return (
    <button
      className={`button ${className}${isActive ? " active" : ""}`}
      onClick={onClick}
      onMouseEnter={() => onMouseEnter(index)}
    >
      {icon ? <WithIcon icon={icon}>{title}</WithIcon> : title}
    </button>
  );
};

const WithIcon = ({ children, icon }) => {
  return (
    <span className="with-icon">
      {icon}
      {children}
    </span>
  );
};

export default memo(Button);
