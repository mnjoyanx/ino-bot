import { memo } from "react";

export default memo(function CardCategory({
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
    >
      <p className="name">{name}</p>
      <p className="total">{total}</p>
    </div>
  );
});
