import { memo } from "react";

export default memo(function LiveIcon({ type }) {
  return <div className={`live-icon ${type}`}>LIVE</div>;
});
