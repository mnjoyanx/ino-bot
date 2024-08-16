import { createSlice } from "@reduxjs/toolkit";

let controlTimeout = null;

const initialState = {
  paused: false,
  showPreviewImages: false,
  showControls: true,
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
  },
});

export const { setPaused } = playerSlice.actions;
export const { setShowPreviewImages } = playerSlice.actions;
export const { setShowControls } = playerSlice.actions;

export const selectIsPaused = (state) => state.player.paused;
export const selectShowPreviewImages = (state) =>
  state.player.showPreviewImages;
export const selectShowControls = (state) => state.player.showControls;

export default playerSlice.reducer;
