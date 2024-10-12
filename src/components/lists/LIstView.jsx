import {
  memo,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import "./ListView.scss";
import useKeydown from "../../hooks/useKeydown";

let styles = {};
let transformTimeout = null;
let rtlMode;

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
  ItemRenderer = () => {},
  onMouseEnter = () => {},
  onUp = () => {},
  onDown = () => {},
  onLeft = () => {},
  onRight = () => {},
  onBack = () => {},
}) {
  //   if (rtlMode != Storege.getRtlMode()) styles = {};
  //   rtlMode = Storege.getRtlMode();

  if (!styles[uniqueKey]) styles[uniqueKey] = {};

  if (startScrollIndex > itemsTotal - 1) startScrollIndex = itemsTotal - 1;

  if (startScrollIndex < 0) startScrollIndex = 0;

  if (initialActiveIndex > itemsTotal - 1) initialActiveIndex = itemsTotal - 1;

  if (initialActiveIndex < 0) initialActiveIndex = 0;

  if (onBackScrollIndex > itemsTotal - 1) onBackScrollIndex = itemsTotal - 1;

  if (onBackScrollIndex < 0) onBackScrollIndex = 0;

  const scrollViewRef = useRef(null);

  const [startIndex, setStartIndex] = useState(0);

  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  const [items, setItems] = useState([]);

  const changeStartIndex = (index) => {
    index -= startScrollIndex;

    if (index > itemsTotal - itemsCount) index = itemsTotal - itemsCount;

    if (index < 0) index = 0;

    setStartIndex(index);
  };

  useEffect(() => {
    setInitialActiveIndex(initialActiveIndex);
  }, [id]);

  const setInitialActiveIndex = (index) => {
    setActiveIndex(index);
    changeStartIndex(index);
  };

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
    if (onBackScrollIndex == null) return onBack();

    setActiveIndex((index) => {
      if (index === onBackScrollIndex) {
        requestAnimationFrame(onBack);
      } else {
        index = onBackScrollIndex;
      }

      changeStartIndex(index);

      return index;
    });
  }, [id, isActive, onBackScrollIndex]);

  const onMouseEnterItem = useCallback((index) => {
    setActiveIndex(index);
    onMouseEnter(index);
  }, []);

  const RenderItem = (index) => {
    if (!styles[uniqueKey][index]) {
      let style = {
        position: "absolute",
        width: itemWidth + "rem",
        height: itemHeight + "rem",
      };

      if (listType === "horizontal") {
        if (direction === "rtl") {
          style.right = index * itemWidth + "rem";
        } else {
          style.left = index * itemWidth + "rem";
        }
        style.top = 0;
      } else {
        style.left = 0;
        style.top = index * itemHeight + "rem";
      }

      styles[uniqueKey][index] = style;
    }

    return (
      <ItemRenderer
        key={uniqueKey + index}
        index={index}
        style={styles[uniqueKey][index]}
        isActive={index == activeIndex && isActive}
        onUp={up}
        onDown={down}
        onLeft={left}
        onRight={right}
        onMouseEnter={onMouseEnterItem}
      />
    );
  };

  useEffect(() => {
    const items = [];

    const start = startIndex - buffer;
    const end = startIndex + itemsCount + buffer;

    for (let i = start; i < end; i++) {
      if (i < 0 || i > itemsTotal - 1) continue;

      items.push(RenderItem(i));
    }

    setItems(items);

    startTransition(() => {
      if (!scrollViewRef.current) return;

      window.transforming = true;
      window.dispatchEvent(new Event("transformstart"));
      clearTimeout(transformTimeout);

      transformTimeout = setTimeout(() => {
        window.transforming = false;
        window.dispatchEvent(new Event("transformend"));
      }, 500);

      if (listType === "horizontal") {
        var transform = `translate3d(${direction == "ltr" ? "-" : ""}${startIndex * itemWidth}rem, 0, 0)`;
      } else {
        var transform = `translate3d(0, -${startIndex * itemHeight}rem, 0)`;
      }

      scrollViewRef.current.style["transform"] = transform;
      scrollViewRef.current.style["-webkit-transform"] = transform;
      scrollViewRef.current.style["-ms-transform"] = transform;
    });
  }, [activeIndex, startIndex, itemsTotal, isActive, initialActiveIndex, id]);

  const keyDownOptions = useMemo(() => {
    return {
      isActive: isActive && nativeControle,
      debounce,
      left,
      right,
      up,
      down,
      channel_up: channelUp,
      channel_down: channelDown,
      back,
    };
  }, [isActive, nativeControle, itemsTotal, id, onBackScrollIndex]);

  useKeydown(keyDownOptions);

  let parentStyle = {};

  if (listType === "horizontal") {
    parentStyle.height = itemHeight + "rem";
  } else {
    parentStyle.width = itemWidth + "rem";
  }

  return (
    <div className={"scroll-view-parent " + listType} style={parentStyle}>
      <div
        className={`scroll-view list-view ${direction == "rtl" ? "rtl-list-view" : ""}`}
        ref={scrollViewRef}
      >
        {items}
      </div>
    </div>
  );
}

export default memo(ListView);
