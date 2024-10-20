import styles from "@styles/components/playbackActions.module.scss";
import SvgBackward from "@assets/icons/SvgBackward";
import SvgPlay from "@assets/images/player/SvgPlay";
import SvgPauseIcon from "@assets/icons/SvgPauseIcon";
import SvgForward from "@assets/icons/SvgForward";

const PlaybackActions = ({ isPaused, focusedControl, onSeek, onPlayPause }) => {
  return (
    <div className={styles["playback_actions"]}>
      <button
        className={`${styles["playback_btn"]}${focusedControl === "backward" ? " focused" : ""}`}
        onClick={() => onSeek("backward")}
      >
        <SvgBackward />
      </button>
      <button
        className={`${styles["playback_btn"]}${focusedControl === "play" ? " focused" : ""}`}
        onClick={onPlayPause}
      >
        {isPaused ? <SvgPlay /> : <SvgPauseIcon />}
      </button>
      <button
        className={`${styles["playback_btn"]}${focusedControl === "forward" ? " focused" : ""}`}
        onClick={() => onSeek("forward")}
      >
        <SvgForward />
      </button>
    </div>
  );
};

export default PlaybackActions;
