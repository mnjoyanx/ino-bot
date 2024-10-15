import React, {
  memo,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "./ListView.scss";
import useKeydown from "../../hooks/useKeydown";

const TRANSFORM_TIMEOUT = 500;

function ListView({
  id,
  uniqueKey = "list-",
  listType = "horizontal",
  nativeControle = false,
  debounce = 300,
  itemsCount,
  itemsTotal,
  buffer,
  itemWidth,
  itemHeight,
  isActive,
  initialActiveIndex = 0,
  onBackScrollIndex = null,
  startScrollIndex = 0,
  direction = "ltr",
  onMouseEnter = () => {},
  onUp = () => {},
  onDown = () => {},
  onLeft = () => {},
  onRight = () => {},
  onBack = () => {},
  renderItem,
  data,
}) {
  const scrollViewRef = useRef(null);
  const [startIndex, setStartIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  const changeStartIndex = useCallback(
    (index) => {
      index -= startScrollIndex;
      if (index > itemsTotal - itemsCount) index = itemsTotal - itemsCount;
      if (index < 0) index = 0;
      setStartIndex(index);
    },
    [itemsTotal, itemsCount, startScrollIndex]
  );

  useEffect(() => {
    setInitialActiveIndex(initialActiveIndex);
  }, [id]);

  const setInitialActiveIndex = (index) => {
    setActiveIndex(index);
    changeStartIndex(index);
  };

  const scrollToIndex = useCallback(
    (index) => {
      setActiveIndex(index);
      changeStartIndex(index);

      // Trigger a re-render to update the transform
      setTimeout(() => {
        setStartIndex((prevStartIndex) => prevStartIndex);
      }, 0);
    },
    [changeStartIndex]
  );

  const next = (count = 1) => {
    setActiveIndex((index) => {
      if (index === itemsTotal - 1) {
        listType == "horizontal"
          ? requestAnimationFrame(onRight)
          : requestAnimationFrame(onDown);
      } else {
        index += count;
        if (index > itemsTotal - 1) index = itemsTotal - 1;
      }

      changeStartIndex(index);

      return index;
    });
  };

  const prev = (count = 1) => {
    setActiveIndex((index) => {
      if (index === 0) {
        listType == "horizontal"
          ? requestAnimationFrame(onLeft)
          : requestAnimationFrame(onUp);
      } else {
        index -= count;
        if (index < 0) index = 0;
      }

      changeStartIndex(index);

      return index;
    });
  };

  const left = useCallback(() => {
    if (listType == "horizontal") prev();
  }, [itemsTotal]);

  const right = useCallback(() => {
    if (listType == "horizontal") next();
  }, [itemsTotal]);

  const up = useCallback(() => {
    if (listType != "horizontal") prev();
  }, [itemsTotal]);

  const down = useCallback(() => {
    if (listType != "horizontal") next();
  }, [itemsTotal]);

  const channelUp = useCallback(() => {
    prev(itemsCount);
  }, [itemsTotal]);

  const channelDown = useCallback(() => {
    next(itemsCount);
  }, [itemsTotal]);

  const back = useCallback(() => {
    if (onBackScrollIndex !== null) {
      scrollToIndex(onBackScrollIndex);
    } else {
      scrollToIndex(0); // Scroll to the first element
    }
    requestAnimationFrame(onBack);
  }, [onBackScrollIndex, scrollToIndex, onBack]);

  const onMouseEnterItem = useCallback((index) => {
    setActiveIndex(index);
    onMouseEnter(index);
  }, []);

  const getItemStyle = useCallback(
    (index) => {
      return {
        position: "absolute",
        width: `${itemWidth}rem`,
        height: `${itemHeight}rem`,
        ...(listType === "horizontal"
          ? {
              [direction === "rtl" ? "right" : "left"]:
                `${index * itemWidth}rem`,
              top: 0,
            }
          : { left: 0, top: `${index * itemHeight}rem` }),
      };
    },
    [itemWidth, itemHeight, listType, direction]
  );

  const renderItems = useCallback(() => {
    const items = [];
    const start = startIndex - buffer;
    const end = startIndex + itemsCount + buffer;

    for (let i = start; i < end; i++) {
      if (i >= 0 && i < itemsTotal) {
        const itemProps = {
          key: `${uniqueKey}${i}`,
          index: i,
          style: getItemStyle(i),
          isActive: i === activeIndex && isActive,
          item: data[i],
          onUp,
          onDown,
          onLeft,
          onRight,
          onMouseEnter: () => onMouseEnter(i),
        };
        items.push(renderItem(itemProps));
      }
    }
    return items;
  }, [
    startIndex,
    buffer,
    itemsCount,
    itemsTotal,
    uniqueKey,
    getItemStyle,
    activeIndex,
    isActive,
    onUp,
    onDown,
    onLeft,
    onRight,
    onMouseEnter,
    renderItem,
    data,
  ]);

  useEffect(() => {
    const applyTransform = () => {
      if (!scrollViewRef.current) return;

      const transform =
        listType === "horizontal"
          ? `translate3d(${direction === "ltr" ? "-" : ""}${startIndex * itemWidth}rem, 0, 0)`
          : `translate3d(0, -${startIndex * itemHeight}rem, 0)`;

      scrollViewRef.current.style.transform = transform;
      scrollViewRef.current.style.webkitTransform = transform;
      scrollViewRef.current.style.msTransform = transform;

      window.dispatchEvent(new Event("transformstart"));
      setTimeout(
        () => window.dispatchEvent(new Event("transformend")),
        TRANSFORM_TIMEOUT
      );
    };

    applyTransform();
  }, [startIndex, listType, direction, itemWidth, itemHeight]);

  const keyDownOptions = useMemo(
    () => ({
      isActive: isActive && nativeControle,
      debounce,
      left: () => listType === "horizontal" && prev(),
      right: () => listType === "horizontal" && next(),
      up: () => listType !== "horizontal" && prev(),
      down: () => listType !== "horizontal" && next(),
      channel_up: () => prev(itemsCount),
      channel_down: () => next(itemsCount),
      back,
    }),
    [isActive, nativeControle, listType, prev, next, itemsCount, back]
  );

  useKeydown(keyDownOptions);

  const parentStyle = useMemo(
    () => ({
      [listType === "horizontal" ? "height" : "width"]:
        `${listType === "horizontal" ? itemHeight : itemWidth}rem`,
    }),
    [listType, itemHeight, itemWidth]
  );

  return (
    <div className={`scroll-view-parent ${listType}`} style={parentStyle}>
      <div
        className={`scroll-view list-view ${direction === "rtl" ? "rtl-list-view" : ""}`}
        ref={scrollViewRef}
      >
        {renderItems()}
      </div>
    </div>
  );
}

export default memo(ListView);
