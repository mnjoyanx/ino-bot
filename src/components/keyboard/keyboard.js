import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { keys, keys_number } from "./dataKeys";
import useKeydown from "../../hooks/useKeydown";

import Key from "./Key";

import "./keyboard.scss";

const Keyboard = ({ show = false, setShow, activeInput, type = "text" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [uppercase, setUppercase] = useState(false);

  useEffect(() => {
    if (activeIndex != 0 || activeRowIndex != 0) {
      setActiveIndex(0);
      setActiveRowIndex(0);
    }
  }, [type]);

  const click_key = useCallback(
    (key) => {
      switch (key.key) {
        case "backspace":
          activeInput.current.value = activeInput.current.value.slice(0, -1);
          break;
        case "enter":
          setShow(false);
          break;
        case "space":
          activeInput.current.value += " ";
          break;
        case "shift":
          setUppercase(!uppercase);
          break;
        default:
          if (activeInput.current.max == activeInput.current.value.length)
            return;
          if (uppercase) activeInput.current.value += key.key.toUpperCase();
          else activeInput.current.value += key.key;
          break;
      }
    },
    [show, uppercase],
  );

  useKeydown({
    isActive: show ? true : false,

    back: () => {
      setShow(false);
    },

    left: () => {
      if (activeIndex === 0)
        setActiveIndex(keys[type][activeRowIndex].length - 1);
      else setActiveIndex(activeIndex - 1);
    },

    right: () => {
      if (activeIndex === keys[type][activeRowIndex].length - 1)
        setActiveIndex(0);
      else setActiveIndex(activeIndex + 1);
    },

    up: () => {
      if (type === "number") return;

      if (activeRowIndex === 0) {
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        }

        setActiveRowIndex(keys[type].length - 1);

        return;
      } else if (activeRowIndex === 1) {
        if (activeIndex === keys[type][activeRowIndex].length - 1) {
          setActiveIndex(keys[type][activeRowIndex - 1].length - 1);
        }
      } else if (activeRowIndex === 2) {
        if (activeIndex === keys[type][activeRowIndex].length - 1) {
          setActiveIndex(keys[type][activeRowIndex - 1].length - 1);
        }
      } else if (activeRowIndex === 3) {
        if (activeIndex > 0) {
          setActiveIndex(activeIndex + 1);
        }
      }

      setActiveRowIndex(activeRowIndex - 1);
    },

    down: () => {
      if (type === "number") return;

      if (activeRowIndex === keys[type].length - 1) {
        if (activeIndex > 0) {
          setActiveIndex(activeIndex + 1);
        }
        setActiveRowIndex(0);
      } else {
        if (activeRowIndex === 1 || activeRowIndex === 2) {
          if (activeRowIndex === 2) {
            if (activeIndex > 1) {
              setActiveIndex(activeIndex - 1);
            } else if (activeIndex === 1) {
              setActiveIndex(0);
            }
          } else if (activeIndex === keys[type][activeRowIndex].length - 1) {
            setActiveIndex(keys[type][activeRowIndex + 1].length - 1);
          }
        }
        setActiveRowIndex(activeRowIndex + 1);
      }
    },

    ok: () => {
      click_key(keys[type][activeRowIndex][activeIndex]);
    },
  });

  const onMouseEnter = useCallback((index, rowIndex) => {
    setActiveIndex(index);
    setActiveRowIndex(rowIndex);
  }, []);

  return (
    <div
      className={`parent_keyboard ${show ? "show" : ""}`}
      onClick={() => setShow(false)}
    >
      <div
        className={`keyboard ${uppercase ? "uppercase" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {keys[type].map((rowElem, rowIndex) => {
          return (
            <div className="keyboard_row" key={rowIndex}>
              {rowElem.map((item, index) => {
                return (
                  <Key
                    onMouseEnter={onMouseEnter}
                    isActive={
                      activeIndex == index && activeRowIndex == rowIndex
                    }
                    key={index}
                    index={index}
                    rowIndex={rowIndex}
                    item={item}
                    click_key={click_key}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(Keyboard);
