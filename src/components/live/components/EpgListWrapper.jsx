import { memo } from "react";

import "../styles/EpgListWrapper.scss";

export default memo(function EpgListWrapper() {
  return (
    <div className="parent-epg_list">
      :<div className="epg-list-wrapper"></div>
    </div>
  );
});
