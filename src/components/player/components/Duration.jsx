import { formatTime } from "@utils/util";

export default function Duration({
  duration = 0,
  color = "white",
  className = "",
  _ref,
}) {
  return (
    <div className={`duration ${className}`}>
      <p ref={_ref}>{formatTime(duration)}</p>
    </div>
  );
}
