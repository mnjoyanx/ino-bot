import { useEffect } from "react";

window.PLAYER = {
  timeupdateEvent: false,

  buffering: function () {
    console.log("buffering");
  },

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

  vout: () => {
    // dispatchEvent(new CustomEvent("playbackLoaded"));
  },

  seekTo: (direction) => {
    if (!window.Android) return;
    window.Android.seekTo(direction);
  },

  getAndroidTracks: () => {
    const tracks = window.Android.getTracks();
    const tracksArr = JSON.parse(tracks);

    const trackSubtitles = tracksArr.filter((track) => track.type === "TEXT");
    const audioTracks = tracksArr.filter((track) => track.type === "AUDIO");
    const videoTracks = tracksArr.filter((track) => track.type === "VIDEO");

    const trackList = trackSubtitles.map((track) => {
      return {
        id: track.id,
        name: track.name,
        lang: track.lang,
        index: track.index,
        track_index: track.track_index,
        group_index: track.group_index,
        is_selected: track.is_selected,
      };
    });

    const filteredSubs = trackList.filter(
      (track) => track.is_supported || !track.hasOwnProperty("is_supported")
    );

    const filteredAudio = audioTracks.filter(
      (track) => track.is_supported || !track.hasOwnProperty("is_supported")
    );

    const filteredVideo = videoTracks.filter(
      (track) => track.is_supported || !track.hasOwnProperty("is_supported")
    );

    dispatchEvent(
      new CustomEvent("getTracks", {
        detail: {
          tracksList: {
            subtitles: filteredSubs,
            audio: filteredAudio,
            video: filteredVideo,
          },
        },
      })
    );

    // console.log(trackList, "trackList");
  },

  playerError: () => {
    console.log("playerError");
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
    top = 0
  ) => {
    if (!window.Android) return;

    let size = 1;

    if (window.innerWidth === 1280) size = 1.5;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const _block_width = width / size;
    const _block_height = height / size;
    const _offset_left = left / size;
    const _offset_top = top / size;

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

export default function AndroidPlayer({
  url,
  timeUpdate,
  time = 0,
  streamEnd,
  onSeek,
  startTime,
  onLoadedMetadata,
  getTracks,
  onErrorHandler,
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

  const getTracksHandler = (tracks) => {
    getTracks(tracks.detail.tracksList);
  };

  const playerErrorHandler = (err) => {
    console.log("playerErrorHandler", err);
    onErrorHandler(err);
  };

  useEffect(() => {
    window.addEventListener("playerTimeUpdate", timeUpdateHandler);
    window.addEventListener("streamEnded", streamEnded);
    window.addEventListener("seekTo", seekToHandler);
    window.addEventListener("playbackLoaded", onLoadedMetadata);
    window.addEventListener("getTracks", getTracksHandler);
    window.addEventListener("playerError", playerErrorHandler);

    return () => {
      window.removeEventListener("playerTimeUpdate", timeUpdateHandler);
      window.removeEventListener("streamEnded", streamEnded);
      window.removeEventListener("seekTo", seekToHandler);
      window.removeEventListener("playbackLoaded", onLoadedMetadata);
      window.removeEventListener("getTracks", getTracksHandler);
      window.removeEventListener("playerError", playerErrorHandler);
    };
  }, []);

  useEffect(() => {
    window.Android.destroyPlayer();

    console.log("url", url);

    if (time) {
      window.Android.initPlayer(url, +time);
    } else {
      window.Android.initPlayer(url);
    }
  }, [url, time]);

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

  return null;
}
