import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCtrl,
  setCtrl,
  selectResolutions,
  selectSubtitles,
  selectAudioTracks,
  setSelectedAudio,
  selectSelectedAudio,
  setSelectedQuality,
  setSelectedSubtitle,
  setSelectedPlaybackSpeed,
  selectSelectedQuality,
  selectSelectedSubtitle,
  selectSelectedPlaybackSpeed,
} from "@app/global";
import { useTranslation } from "react-i18next";
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
    value: { id: "Auto", name: "Auto" },
    children: [{ id: "Auto", name: "Auto" }],
  },
  {
    name: "Playback Speed",
    value: { id: "1x", name: "1x" },
    children: [
      { id: "0.25x", name: "0.25x" },
      { id: "0.5x", name: "0.5x" },
      { id: "0.75x", name: "0.75x" },
      { id: "1x", name: "1x" },
      { id: "1.25x", name: "1.25x" },
      { id: "1.5x", name: "1.5x" },
      { id: "2x", name: "2x" },
    ],
  },
  {
    name: "Audio",
    value: { id: "Default", name: "Default" },
    children: [{ id: "Default", name: "Default" }],
  },
  {
    name: "Subtitles",
    value: { id: "Off", name: "Off" },
    children: [{ id: "Off", name: "Off" }],
  },
];

const ControlSettings = ({ isVisible, onClose, showControl }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const audioTracks = useSelector(selectAudioTracks);
  const ctrl = useSelector(selectCtrl);
  const resolutions = useSelector(selectResolutions);
  const subtitles = useSelector(selectSubtitles);
  const selectedQuality = useSelector(selectSelectedQuality);
  const selectedSubtitle = useSelector(selectSelectedSubtitle);
  const selectedAudio = useSelector(selectSelectedAudio);

  const selectedPlaybackSpeed = useSelector(selectSelectedPlaybackSpeed);
  const [activeOption, setActiveOption] = useState(0);
  const [expandedOption, setExpandedOption] = useState(null);
  const [activeChild, setActiveChild] = useState(0);
  const [settingsOptions, setSettingsOptions] = useState(
    initialSettingsOptions
  );

  useEffect(() => {
    setSettingsOptions((prevOptions) => {
      const newOptions = [...prevOptions];

      if (window.Android) {
        newOptions.splice(1, 1);
      }

      if (resolutions?.length > 0) {
        const qualityIndex = window.Android ? 0 : 0;
        newOptions[qualityIndex] = {
          name: t("Quality"),
          value: selectedQuality || { id: "Auto", name: "Auto" },
          children: [
            { id: "Auto", name: "Auto" },
            ...resolutions.map((res) => ({
              id: typeof res === "object" ? `${res.height}p` : `${res}p`,
              name: typeof res === "object" ? `${res.height}p` : `${res}p`,
              index: res.index,
              track_index: res.track_index,
              group_index: res.group_index,
            })),
          ],
        };
      }

      if (audioTracks?.length > 0) {
        const audioIndex = window.Android ? 1 : 2;
        newOptions[audioIndex] = {
          name: t("Audio"),
          value: selectedAudio || { id: "Default", name: "Default" },
          children: audioTracks.map((track) => ({
            id: track.id,
            name: track.name || `Audio ${track.id}`,
            index: track.index,
            group_index: track.group_index,
          })),
        };
      }

      // Update Playback Speed options if not on Android
      if (!window.Android) {
        newOptions[1] = {
          ...newOptions[1],
          value: selectedPlaybackSpeed,
        };
      }

      // Update Subtitles options
      if (subtitles?.length > 0) {
        const subtitleIndex = window.Android ? 2 : 3;
        newOptions[subtitleIndex] = {
          name: t("Subtitles"),
          value: selectedSubtitle || { id: "Off", name: "Off" },
          children: [
            { id: "Off", name: "Off" },
            ...subtitles.map((sub) => ({
              id: sub.id,
              name: sub.name,
              index: sub.index,
              track_index: sub.track_index,
              group_index: sub.group_index,
            })),
          ],
        };
      }

      return newOptions;
    });
  }, [
    resolutions,
    subtitles,
    audioTracks,
    selectedAudio,
    selectedQuality,
    selectedSubtitle,
    selectedPlaybackSpeed,
  ]);

  const handleOptionSelect = (optionIndex, newValue) => {
    setSettingsOptions((prevOptions) => {
      const newOptions = [...prevOptions];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        value: newValue,
      };
      return newOptions;
    });

    let actualIndex = optionIndex;
    if (window.Android) {
      switch (settingsOptions[optionIndex].name) {
        case "Quality":
          actualIndex = 0;
          break;
        case "Audio":
          actualIndex = 1;
          break;
        case "Subtitles":
          actualIndex = 2;
          break;
        default:
          break;
      }
    } else {
      switch (settingsOptions[optionIndex].name) {
        case "Quality":
          actualIndex = 0;
          break;
        case "Playback Speed":
          actualIndex = 1;
          break;
        case "Audio":
          actualIndex = 2;
          break;
        case "Subtitles":
          actualIndex = 3;
          break;
        default:
          break;
      }
    }

    if (window.Android) {
      switch (actualIndex) {
        case 0:
          window.Android.selectTrack(
            "VIDEO",
            newValue.track_index,
            newValue.group_index
          );
          dispatch(setSelectedQuality(newValue));
          break;
        case 1:
          window.Android.selectTrack(
            "AUDIO",
            newValue.track_index,
            newValue.group_index
          );
          dispatch(setSelectedAudio(newValue));
          break;
        case 2:
          if (newValue.id === "Off") {
            window.Android.selectTrack("TEXT", -1, -1);
          } else {
            window.Android.selectTrack(
              "TEXT",
              newValue.track_index,
              newValue.group_index
            );
          }
          dispatch(setSelectedSubtitle(newValue));
          break;
        default:
          break;
      }
    } else {
      switch (actualIndex) {
        case 0:
          dispatch(setSelectedQuality(newValue));
          break;
        case 1:
          dispatch(setSelectedPlaybackSpeed(newValue));
          break;
        case 2:
          dispatch(setSelectedAudio(newValue));
          break;
        case 3:
          dispatch(setSelectedSubtitle(newValue));
          break;
        default:
          break;
      }
    }
  };

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
        if (
          settingsOptions[expandedOption].children[activeChild].id ===
          settingsOptions[expandedOption].value.id
        ) {
          return;
        }
        const newValue = settingsOptions[expandedOption].children[activeChild];
        handleOptionSelect(expandedOption, newValue);
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

  useEffect(() => {
    console.log(settingsOptions, "settingsOptions");
  }, [settingsOptions]);

  if (!isVisible) return null;

  return (
    <div className={styles.controlSettingsWrapper}>
      <div className={styles.controlSettings}>
        <div className={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <div
              key={option.name + Math.random()}
              className={styles.settingGroup}
            >
              <div
                className={`${styles.settingsOption} ${
                  activeOption === index ? styles.active : ""
                } ${expandedOption === index ? styles.expanded : ""}`}
              >
                <div className={styles.optionContent}>
                  <span>{option.name}</span>
                  <span>{option.value?.name || t("Default")}</span>
                </div>
                <ArrowIcon isRotated={expandedOption === index} />
              </div>
              {expandedOption === index && (
                <div className={styles.childrenContainer}>
                  {option.children.map((child, childIndex) => (
                    <div
                      key={child.id}
                      className={`${styles.childOption} ${
                        activeChild === childIndex ? styles.active : ""
                      }`}
                    >
                      {child.id == option.value.id && <CheckIcon />}
                      <span>{child.name}</span>
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
