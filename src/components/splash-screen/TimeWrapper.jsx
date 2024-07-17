import { useEffect, useState } from "react";
import { formatDate } from "@utils/util";

import "./styles/TimeWrapper.scss";

export default function TimeWrapper() {
  const [time, setTime] = useState(new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().getTime());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="time-wrapper">
      <p className="time">{formatDate(new Date(time), "HH:mm")}</p>
      <p className="day">{formatDate(new Date(time), "MMM dd - EEEE")}</p>
    </div>
  );
}
