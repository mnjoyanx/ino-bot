import { useEffect } from "react";
import check_key from "../utils/keys";
import store from "@app/store";

let isConnected = true;

store.subscribe(() => {
  console.log(store.getState().global.isConnected, '----')
  isConnected = store.getState().global.isConnected;
});

function useKeydown(props) {


  useEffect(() => {
    const handleKeydown = (e) => {
      event.preventDefault();
      let key = check_key(e);


      if (key && !isNaN(key) && props["number"]) key = "number";

      if (props[key]) props[key](e);

      if (props.handleKeyPress) {
        props.handleKeyPress(e.key);
      }
    };


    if (props.isActive && isConnected) {
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [props, isConnected]);
}

export default useKeydown;
