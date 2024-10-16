import styles from "@styles/components/playbackActions.module.scss";
import SvgBackward from "@assets/icons/SvgBackward";
import SvgPlay from "@assets/images/player/SvgPlay";
import SvgPauseIcon from "@assets/icons/SvgPauseIcon";
import SvgForward from "@assets/icons/SvgForward";

const PlaybackActions = ({ isPaused }) => {
  return (
    <div className={styles["playback_actions"]}>
      <div className={styles["playback_btn"]}>
        <SvgBackward />
      </div>
      <div className={styles["playback_btn"]}>
        {isPaused ? <SvgPlay /> : <SvgPauseIcon />}
      </div>
      <div className={styles["playback_btn"]}>
        <SvgForward />
      </div>
    </div>
  );
};

export default PlaybackActions;
