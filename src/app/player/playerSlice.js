import { createSlice } from "@reduxjs/toolkit";

let controlTimeout = null;

const initialState = {
  paused: false,
  showPreviewImages: false,
  showControls: true,
  currentArchive: null,
  nextArchive: null,
  archives: [],
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPaused: (state, action) => {
      state.paused = action.payload;
    },
    setShowPreviewImages: (state, action) => {
      state.showPreviewImages = action.payload;
    },
    setShowControls: (state, action) => {
      state.showControls = action.payload;

      clearTimeout(controlTimeout);

      controlTimeout = setTimeout(() => {
        state.showControls = false;
      }, 2000);
    },
    setArchives: (state, action) => {
      state.archives = action.payload;
    },
    setCurrentArchive: (state, action) => {
      state.currentArchive = action.payload;
      const currentIndex = state.archives.findIndex((archive) => {
        return archive.start_ut > action.payload.start_ut;
      });

      state.nextArchive = state.archives[currentIndex] || null;
    },
  },
});

export const { setPaused } = playerSlice.actions;
export const { setShowPreviewImages } = playerSlice.actions;
export const { setShowControls } = playerSlice.actions;
export const { setArchives, setCurrentArchive } = playerSlice.actions;

export const selectIsPaused = (state) => state.player.paused;
export const selectShowPreviewImages = (state) =>
  state.player.showPreviewImages;
export const selectShowControls = (state) => state.player.showControls;
export const selectArchives = (state) => state.player.archives;
export const selectCurrentArchive = (state) => state.player.currentArchive;
export const selectNextArchive = (state) => state.player.nextArchive;

export default playerSlice.reducer;
