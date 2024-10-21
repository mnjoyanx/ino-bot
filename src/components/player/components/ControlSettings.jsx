import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCtrl, setCtrl } from "@app/global";
import useKeydown from "@hooks/useKeydown";
import styles from "@styles/components/controlSettings.module.scss";

const ArrowIcon = ({ isRotated }) => (
  <svg
    width="1rem"
    height="1.8rem"
    className={`${styles.arrowIcon} ${isRotated ? styles.rotated : ""}`}
    viewBox="0 0 10 18"
    fill="none"
  >
    <path
      d="M1.22876 17.0034L8.59472 9.17708L1.22876 1.35075"
      stroke="white"
      strokeWidth="1.30292"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className={styles.checkIcon} viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const initialSettingsOptions = [
  {
    name: "Quality",
    value: "Auto",
    children: ["Auto", "1080p", "720p", "480p", "360p"],
  },
  {
    name: "Playback Speed",
    value: "1x",
    children: ["0.25x", "0.5x", "0.75x", "1x", "1.25x", "1.5x", "2x"],
  },
  {
    name: "Subtitles",
    value: "Off",
    children: ["Off", "English", "Spanish", "French"],
  },
];

const ControlSettings = ({ isVisible, onClose, showControl }) => {
  const dispatch = useDispatch();
  const ctrl = useSelector(selectCtrl);
  const [activeOption, setActiveOption] = useState(0);
  const [expandedOption, setExpandedOption] = useState(null);
  const [activeChild, setActiveChild] = useState(0);
  const [settingsOptions, setSettingsOptions] = useState(
    initialSettingsOptions
  );

  useEffect(() => {
    if (isVisible) {
      dispatch(setCtrl("settings"));
    }
  }, [isVisible, dispatch]);

  useKeydown({
    isActive: ctrl === "settings",
    up: () => {
      showControl();
      if (expandedOption !== null) {
        setActiveChild((prev) => Math.max(0, prev - 1));
      } else {
        setActiveOption((prev) => Math.max(0, prev - 1));
      }
    },
    down: () => {
      showControl();
      if (expandedOption !== null) {
        setActiveChild((prev) =>
          Math.min(
            settingsOptions[expandedOption].children.length - 1,
            prev + 1
          )
        );
      } else {
        setActiveOption((prev) =>
          Math.min(settingsOptions.length - 1, prev + 1)
        );
      }
    },
    left: () => {
      showControl();
      if (expandedOption !== null) {
        setExpandedOption(null);
        setActiveChild(0);
      } else {
        onClose();
      }
    },
    right: () => {
      showControl();
      if (expandedOption === null) {
        setExpandedOption(activeOption);
      }
    },
    ok: () => {
      showControl();
      if (expandedOption !== null) {
        const newValue = settingsOptions[expandedOption].children[activeChild];
        setSettingsOptions((prevOptions) => {
          const newOptions = [...prevOptions];
          newOptions[expandedOption] = {
            ...newOptions[expandedOption],
            value: newValue,
          };
          return newOptions;
        });
      } else {
        setExpandedOption(activeOption);
      }
    },
    back: () => {
      showControl();
      if (expandedOption !== null) {
        setExpandedOption(null);
        setActiveChild(0);
      } else {
        onClose();
      }
    },
  });

  if (!isVisible) return null;

  return (
    <div className={styles.controlSettingsWrapper}>
      <div className={styles.controlSettings}>
        <div className={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <div key={option.name} className={styles.settingGroup}>
              <div
                className={`${styles.settingsOption} ${
                  activeOption === index ? styles.active : ""
                } ${expandedOption === index ? styles.expanded : ""}`}
              >
                <div className={styles.optionContent}>
                  <span>{option.name}</span>
                  <span>{option.value}</span>
                </div>
                <ArrowIcon isRotated={expandedOption === index} />
              </div>
              {expandedOption === index && (
                <div className={styles.childrenContainer}>
                  {option.children.map((child, childIndex) => (
                    <div
                      key={child}
                      className={`${styles.childOption} ${
                        activeChild === childIndex ? styles.active : ""
                      }`}
                    >
                      {child === option.value && <CheckIcon />}
                      <span>{child}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlSettings;
