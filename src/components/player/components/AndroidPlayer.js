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
      }),
    );
  },

  isPlayingChanged: () => {},

  vout: () => {
    // dispatchEvent(new CustomEvent("playbackLoaded"));
  },

  seekTo: (direction) => {
    if (!window.Android) return;
    window.Android.seekTo(direction);
  },

  getAndroidTracks: () => {},

  playerError: () => {
    dispatchEvent(new CustomEvent("playerError", {}));
  },

  streamEnd: () => {
    dispatchEvent(new CustomEvent("streamEnded", {}));
  },

  destroyPlayer: () => {
    if (!window.Android) return;
    window.Android.destroyPlayer();
  },

  setPositionPlayer: (
    width = window.innerWidth,
    height = window.innerHeight,
    left = 0,
    top = 0,
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
      screenHeight,
    );
  },
};

export default function AndroidPlayer({
  url,
  timeUpdate,
  time = 0,
  streamEnd,
  onSeek,
  startTime,
  onLoadedMetadata,
  adTagUrl,
}) {
  const streamEnded = () => {
    streamEnd();
  };
  const timeUpdateHandler = () => {
    const currentTime = window.Android.getCurrentTime();
    const duration = window.Android.getVideoDuration();
    timeUpdate(currentTime, duration);
  };

  const seekToHandler = (direction) => {
    onSeek(direction);
  };

  useEffect(() => {
    window.addEventListener("playerTimeUpdate", timeUpdateHandler);
    window.addEventListener("streamEnded", streamEnded);
    window.addEventListener("seekTo", seekToHandler);
    window.addEventListener("playbackLoaded", onLoadedMetadata);
    return () => {
      window.removeEventListener("playerTimeUpdate", timeUpdateHandler);
      window.removeEventListener("streamEnded", streamEnded);
      window.removeEventListener("seekTo", seekToHandler);
      window.removeEventListener("playbackLoaded", onLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (adTagUrl && window.Android?.playAd) {
      // Play ad first, then initialize the player
      window.Android.playAd(
        adTagUrl,
        () => {
          // Ad completed callback
          if (time) {
            window.Android.initPlayer(url, +time);
          } else {
            window.Android.initPlayer(url);
          }
        },
        (error) => {
          // Ad error callback - proceed to content
          console.error("Ad error:", error);
          if (time) {
            window.Android.initPlayer(url, +time);
          } else {
            window.Android.initPlayer(url);
          }
        },
      );
    } else {
      // No ad, play content directly
      window.Android.destroyPlayer();
      if (time) {
        window.Android.initPlayer(url, +time);
      } else {
        window.Android.initPlayer(url);
      }
    }
  }, [url, time, adTagUrl]);

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
