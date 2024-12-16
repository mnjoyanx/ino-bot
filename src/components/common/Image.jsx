import { memo, useCallback } from "react";

function Image(props) {
  const onError = useCallback((e) => {
    if (e.target.src != props.placeholder) e.target.src = props.placeholder;
  }, []);

  return <img {...props} alt="" onError={onError} />;
}

export default memo(Image);
