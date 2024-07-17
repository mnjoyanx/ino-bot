import { formatTime } from "@utils/util";

export default function Duration({
  duration = 0,
  color = "white",
  className = "duration",
}) {
  return (
    <div className={className}>
      <p>{formatTime(duration)}</p>
    </div>
  );
}
