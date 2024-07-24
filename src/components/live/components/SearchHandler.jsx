import { memo } from "react";

import useKeydown from "@hooks/useKeydown";

import SvgSearch from "@assets/images/live/SvgSearch";

export default memo(function SearchHandler({
  isActive,
  control,
  setControl,
  onClick,
}) {
  useKeydown({
    isActive: control,

    ok: () => onClick(),
    down: () => {
      setControl("category");
    },
  });
  return (
    <div className={"search-handler"} onClick={onClick}>
      <div className={`main_search${isActive ? " active" : ""}`}>
        <SvgSearch />
        <p>Search</p>
      </div>
    </div>
  );
});
