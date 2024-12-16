import { memo } from "react";

import "./modal.scss";

export default memo(function MainModal({
  children,
  setShow,
  show = true,
  icon = true,
  className,
}) {
  return show ? (
    <>
      <div className="parent-modal" onClick={() => setShow(false)}></div>
      <div className={"modal" + " " + className}>
        {/* {icon ? (
          <div className="icon">
            <SvgWarning />
          </div>
        ) : null} */}
        {children}
      </div>
    </>
  ) : null;
});
