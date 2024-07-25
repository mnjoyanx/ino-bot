import { memo } from "react";

export default memo(function Item({ title, isActive }) {
  return <p className={`item-settings${isActive ? " active" : ""}`}>{title}</p>;
});
