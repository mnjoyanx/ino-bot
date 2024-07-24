import { memo } from "react";

import SvgSearch from "@assets/images/live/SvgSearch";
import LOCAL_STORAGE from "@utils/localStorage";

export default memo(function HeadSearch({control}) {
  return (
    <div className="head-search">
      <img src={LOCAL_STORAGE.LOGO.GET()} alt="" className="logo" />
      <SvgSearch />
    </div>
  );
});
