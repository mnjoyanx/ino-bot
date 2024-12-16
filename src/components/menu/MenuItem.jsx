import { memo } from "react";

export default memo(function MenuItem({
  item,
  isActive,
  index,
  onClick,
  onMouseEnter,
}) {
  return (
    <div
      className={`menu-item${isActive ? " active" : ""}`}
      style={{ backgroundImage: `url(${item.bg_image})` }}
      onClick={() => onClick(item.path)}
      onMouseEnter={() => onMouseEnter(index)}
    >
      <div className="icon">{item.icon}</div>
      <p className="title">{item.title}</p>
    </div>
  );
});
