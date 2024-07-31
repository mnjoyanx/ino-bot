import { memo } from "react";

export default memo(function LiveIcon({ type, isActive = false }) {
  return (
    <div className={`live-icon ${type}${isActive ? " active" : ""}`}>LIVE</div>
  );
});
