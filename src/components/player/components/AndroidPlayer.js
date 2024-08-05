import { useEffect } from "react";

window.PLAYER = {
  timeupdateEvent: false,

  androidPlayerTimeUpdate: function () {
    const currentTime = window.Android.getCurrentTime();
    const duration = window.Android.getVideoDuration();
    // const progress = (currentTime / duration) * 100;

    dispatchEvent(
      new CustomEvent("playerTimeUpdate", {
        detail: { current: currentTime, duration: duration },
      })
    );
  },

  isPlayingChanged: () => {},

  vout: () => {},

  getAndroidTracks: () => {},

  playerError: () => {},

  setPositionPlayer: (
    width = window.innerWidth,
    height = window.innerHeight,
    left = 0,
    top = 0
  ) => {
    if (!window.Android) return;

    let size = 1;

    if (window.innerWidth === 1280) size = 1.5;

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    let _block_width = width / size;
    let _block_height = height / size;
    let _offset_left = left / size;
    let _offset_top = top / size;

    window.Android.setPlayerPositions(
      _block_width,
      _block_height,
      _offset_left,
      _offset_top,
      screenWidth,
      screenHeight
    );
  },
};

export default function AndroidPlayer({ url, timeUpdate, time = 0 }) {
  const timeUpdateHandler = () => {
    console.log("time update");
    const currentTime = window.Android.getCurrentTime();
    const duration = window.Android.getVideoDuration();
    timeUpdate(currentTime, duration);
  };

  useEffect(() => {
    window.addEventListener("playerTimeUpdate", timeUpdateHandler);

    return () => {
      window.removeEventListener("playerTimeUpdate", timeUpdateHandler);
    };
  }, []);

  useEffect(() => {
    window.Android.destroyPlayer();

    window.Android.initPlayer(url, time);
  }, [url]);

  //   useEffect(() => {
  //     timeUpdateHandler();
  //   }, [window.Android.getCurrentTime()]);

  useEffect(() => {
    const state = window.Android.getSate();
    if (state === 1) {
      //STATE_IDLE
    } else if (state === 2) {
      //STATE_BUFFERING
    } else if (state === 3) {
      //STATE_READY
    } else if (state === 4) {
      //STATE_ENDED
    }
  }, [window.Android.getSate()]);

  return <></>;
}
