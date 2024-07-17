import { memo } from "react";

export default memo(function CardCategory({
  isActive,
  name,
  index,
  total,
  onClick,
}) {
  return (
    <div
      className={`card-category${isActive ? " active" : ""}`}
      onClick={() => onClick(name)}
    >
      <p className="name">{name}</p>
      <p className="total">{total}</p>
    </div>
  );
});
