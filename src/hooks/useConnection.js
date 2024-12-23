import { useEffect, useState } from "react";
import store from "@app/store";

const setConnection = store.dispatch;

export default function useConnection() {
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    window.addEventListener("online", () => {
      setIsConnected(true);
      setConnection({ type: "setConnection", payload: true });
    });
    window.addEventListener("offline", () => {
      setIsConnected(false);
      setConnection({ type: "setConnection", payload: false });
    });

    return () => {
      window.removeEventListener("online", () => {});
      window.removeEventListener("offline", () => {});
    };
  }, []);

  return isConnected;
}
