import { memo } from "react";
import BackButton from "@components/common/BackButton";

import SvgSearch from "@assets/images/live/SvgSearch";
import LOCAL_STORAGE from "@utils/localStorage";

export default memo(function HeadSearch({
  control,
  setShowSearchHandler,
  setControl,
}) {
  return (
    <div className="head-search">
      <div className="back-button-search">
        <BackButton
          path="live"
          onOkHandler={() => {
            setShowSearchHandler(false);
          }}
          onDownHandler={() => {
            setControl("result");
          }}
        />
      </div>
      <img src={LOCAL_STORAGE.LOGO.GET()} alt="" className="logo" />
      <SvgSearch />
    </div>
  );
});
