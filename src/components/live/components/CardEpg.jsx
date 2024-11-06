import { memo } from "react";
import { formatDate } from "@utils/util";

export default memo(function CardEpg({
  item,
  isActive,
  onClick,
  currentEpg,
  hasArchive,
  nextEpg,
  type,
}) {
  return (
    <div
      className={`card-epg${isActive ? " active" : ""}`}
      onClick={hasArchive && type == "past" ? () => onClick(item) : () => {}}
    >
      <div className={`square ${type} ${hasArchive}${nextEpg ? " next" : ""}`}>
        {type == "past" ? (
          hasArchive ? (
            <span>Rec</span>
          ) : (
            <span>N/A</span>
          )
        ) : type == "now" ? (
          <span>Now</span>
        ) : type == "future" ? (
          nextEpg ? (
            <span>Next</span>
          ) : (
            <span>N/A</span>
          )
        ) : null}
      </div>
      <p className="date_time">
        {formatDate(new Date(item.start_ut * 1000), "dd/MM")} |{" "}
        {formatDate(new Date(item.start_ut * 1000), "hh:mm aaa")} {" - "}
        {formatDate(new Date(item.stop_ut * 1000), "hh:mm aaa")}
      </p>
      <p className="title">{item.name}</p>
    </div>
  );
});
