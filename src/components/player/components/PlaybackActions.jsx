import styles from "@styles/components/playbackActions.module.scss";
import SvgBackward from "@assets/icons/SvgBackward";
import SvgPlay from "@assets/images/player/SvgPlay.jsx";
import SvgPauseIcon from "@assets/icons/SvgPauseIcon";
import SvgForward from "@assets/icons/SvgForward";

const PlaybackActions = ({ isPaused, activeIndex, onSeek, onPlayPause }) => {
  const actions = [
    {
      key: "backward",
      icon: <SvgBackward />,
      onClick: () => onSeek("backward"),
    },
    {
      key: "play",
      icon: isPaused ? <SvgPlay /> : <SvgPauseIcon />,
      onClick: onPlayPause,
    },
    { key: "forward", icon: <SvgForward />, onClick: () => onSeek("forward") },
  ];

  return (
    <div className={styles["playback_actions"]}>
      {actions.map((action, index) => (
        <button
          key={action.key}
          className={`${styles["playback_btn"]}${index === activeIndex ? " " + styles["active"] : ""}`}
          onClick={action.onClick}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};

export default PlaybackActions;
