// import LOCAL_STORAGE from "./localStorage";
// import TIZEN from "../services/platform/tizen";
// import WEBOS from "../services/platform/webos";
// import BROWSER from "../services/platform/browser";

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

  var day = date.getDate(),
    month = date.getMonth(),
    year = date.getFullYear(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds(),
    miliseconds = date.getMilliseconds(),
    h = hour % 12,
    hh = twoDigitPad(h),
    HH = twoDigitPad(hour),
    mm = twoDigitPad(minute),
    ss = twoDigitPad(second),
    aaa = hour < 12 ? "AM" : "PM",
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

export const applicationLogout = (callback) => {};

export const setCssVariables = (colors) => {
  const root = document.documentElement;

  root.style.setProperty("--primary-color", colors.primary_color);
  // root.style.setProperty("--primary-color", "#FFEF00");
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
        encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key])
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

  let mac = [];

  if (str.length < 12) {
    let chars = "abcdef0123456789";

    let count = 12 - str.length;

    for (let i = 0; i < count; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  for (let i = 0; i < 6; i++) {
    mac.push(str.substr(i * 2, 2));
  }

  return mac.join(":");
};

export const formatTime = (seconds) => {
  if (!seconds) return "00:00";

  var hh = Math.floor(seconds / 3600),
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
