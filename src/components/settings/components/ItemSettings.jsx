import { memo } from "react";

export default memo(function Item({ title, isActive, onMouseEnter, index }) {
  return (
    <p
      onMouseEnter={() => onMouseEnter(index)}
      className={`item-settings${isActive ? " active" : ""}`}
    >
      {title}
    </p>
  );
});
