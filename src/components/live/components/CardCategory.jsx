import { memo } from "react";

export default memo(function CardCategory({
  style,
  isActive,
  name,
  index,
  total,
  onClick,
  isSelected,
}) {
  return (
    <div
      className={`card-category${isActive ? " active" : ""}${isSelected ? " selected" : ""}`}
      onClick={() => onClick(name)}
      style={style}
    >
      <p className="name">{name}</p>
      <p className="total">{total}</p>
    </div>
  );
});
