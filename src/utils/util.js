import TIZEN from "@services/platform/tizen";
import WEBOS from "@services/platform/webos";
import BROWSER from "@services/platform/browser";
import LOCAL_STORAGE from "@utils/localStorage";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const dayOfWeekNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const twoDigitPad = (num) => {
  return num < 10 ? "0" + num : num;
};

export const formatDate = (date, patternStr) => {
  if (!patternStr) patternStr = "M/d/yyyy";

  const day = date.getDate(),
    month = date.getMonth(),
    year = date.getFullYear(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds(),
    miliseconds = date.getMilliseconds(),
    h = hour % 12 || 12, // Use 12 instead of 0 for midnight/noon
    hh = twoDigitPad(h),
    HH = twoDigitPad(hour),
    mm = twoDigitPad(minute),
    ss = twoDigitPad(second),
    aaa = hour < 12 ? "am" : "pm",
    EEEE = dayOfWeekNames[date.getDay()],
    EEE = EEEE.substr(0, 3),
    dd = twoDigitPad(day),
    M = month + 1,
    MM = twoDigitPad(M),
    MMMM = monthNames[month],
    MMM = MMMM.substr(0, 3),
    yyyy = year + "",
    yy = yyyy.substr(2, 2);
  // checks to see if month name will be used
  patternStr = patternStr
    .replace("hh", hh)
    .replace("h", h)
    .replace("HH", HH)
    .replace("H", hour)
    .replace("mm", mm)
    .replace("m", minute)
    .replace("ss", ss)
    .replace("s", second)
    .replace("S", miliseconds)
    .replace("dd", dd)
    .replace("d", day)

    .replace("EEEE", EEEE)
    .replace("EEE", EEE)
    .replace("yyyy", yyyy)
    .replace("yy", yy)
    .replace("aaa", aaa);
  if (patternStr.indexOf("MMM") > -1) {
    patternStr = patternStr.replace("MMMM", MMMM).replace("MMM", MMM);
  } else {
    patternStr = patternStr.replace("MM", MM).replace("M", M);
  }
  return patternStr;
};

export const formatTime = (seconds) => {
  if (!seconds) return "00:00";

  const hh = Math.floor(seconds / 3600),
    mm = Math.floor(seconds / 60) % 60,
    ss = Math.floor(seconds) % 60;

  if (hh) {
    return (
      (hh < 10 ? "0" : "") +
      hh +
      ":" +
      (mm < 10 ? "0" : "") +
      mm +
      ":" +
      (ss < 10 ? "0" : "") +
      ss
    );
  } else {
    return (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
  }
};

export const applicationExit = () => {
  const os = LOCAL_STORAGE.DEVICE_OS.GET();

  if (os == "tizen") {
    TIZEN.EXIT();
  } else if (os == "webos") {
    WEBOS.EXIT();
  } else {
    BROWSER.EXIT();
  }
};

export const setCssVariables = (colors) => {
  const root = document.documentElement;

  root.style.setProperty("--primary-color", colors.primary_color);
  root.style.setProperty("--color-secondary", "#555");
  root.style.setProperty("--color-tertiary", "#777");
  root.style.setProperty("--color-quaternary", "#999");
  root.style.setProperty("--color-quinary", "#bbb");
  root.style.setProperty("--color-senary", "#ddd");
  root.style.setProperty("--color-septenary", "#fff");
  root.style.setProperty("--color-octonary", "#000");
  root.style.setProperty("--color-nonary", "#222");
  root.style.setProperty("--color-denary", "#444");
};

export const constructQueryString = (queryParams) => {
  return Object.keys(queryParams)
    .map(
      (key) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]),
    )
    .join("&");
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const debounce = (func, delay) => {
  let inDebounce;
  return function () {
    const args = arguments;
    const context = this;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };
};

export const generateMacAddress = (str) => {
  // str replace all symbols except numbers and letters

  str = str.replace(/[^a-z0-9]/gi, "");

  const mac = [];

  if (str.length < 12) {
    const chars = "abcdef0123456789";

    const count = 12 - str.length;

    for (let i = 0; i < count; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  for (let i = 0; i < 6; i++) {
    mac.push(str.substr(i * 2, 2));
  }

  return mac.join(":");
};

export const scrollElement = (
  element,
  type = "X",
  size = "0rem",
  duration = 0,
) => {
  if (!element) return;

  element.style.transform = `translate${type.toUpperCase()}(${size})`;
};

export const imageResizer = (host, imageUrl, width, height, fit, format) => {
  let url = "";

  if (!host) return;
  try {
    const newurl = btoa(unescape(encodeURIComponent(imageUrl)));
    const newhost = host;
    let size = "";

    if (height) {
      size = width + "x" + height;
    } else {
      size = width;
    }

    const hash = "btoa_escape";
    let is_blured = "";

    if (format) {
      is_blured += "&format=" + format;
    }

    url =
      newhost +
      "/?url=" +
      newurl +
      "&size=" +
      size +
      "&fit=" +
      fit +
      "&hash=" +
      hash +
      is_blured;
  } catch (error) {
    console.log(error, "error");
  }

  return url;
};

export const setUrlArchive = (item, currentChannel) => {
  const { start_ut, stop_ut } = item;

  let __host = "";
  let _url = "";
  let ip = currentChannel.archived_channel.archiver.ip;

  if (ip.indexOf("http") == -1) ip = "http://" + ip;

  if (ip.indexOf("https") > -1) __host = ip;
  else __host = ip + ":" + currentChannel.archived_channel.archiver.port;

  _url =
    __host +
    "/archive/" +
    currentChannel.archived_channel.channelId +
    "/index.m3u8" +
    "?start=" +
    start_ut +
    "&duration=" +
    (stop_ut - start_ut);

  return _url;
  // setUrl(_url);
};
