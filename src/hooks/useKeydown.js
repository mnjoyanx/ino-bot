import { useEffect } from "react";
import check_key from "../utils/keys";

function useKeydown(props) {
  useEffect(() => {
    const handleKeydown = (e) => {
      event.preventDefault();
      let key = check_key(e);

      // if (props.move) {
      //   props.move(e);
      // }

      if (key && !isNaN(key) && props["number"]) key = "number";

      if (props[key]) props[key](e);

      if (props.handleKeyPress) {
        props.handleKeyPress(e.key);
      }
    };

    if (props.isActive) {
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [props]);
}

export default useKeydown;
