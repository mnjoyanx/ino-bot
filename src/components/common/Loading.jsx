import { memo } from "react";

import "./styles/loading.scss";

function Loading() {
  return (
    <div className="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export default memo(Loading);
