import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ctrl: "",
  isOpenMainSidebar: false,
  isPlayerOpen: false,
  isMovieSearchBarOpen: false,
  subtitles: [],
  resolutions: [],
  selectedQuality: "Auto",
  selectedSubtitle: "Off",
  selectedPlaybackSpeed: "1x",
  cropHost: "",
  isConnected: true,
  selectedType: "",
  isProtectedModalOpen: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setCtrl: (state, action) => {
      console.warn(action.payload, "opaykiad");
      state.ctrl = action.payload;
    },
    setIsOpenMainSidebar: (state, action) => {
      state.isOpenMainSidebar = action.payload;
    },
    setIsPlayerOpen: (state, action) => {
      state.isPlayerOpen = action.payload;
    },
    setIsMovieSearchBarOpen: (state, action) => {
      state.isMovieSearchBarOpen = action.payload;
    },
    setSubtitles: (state, action) => {
      state.subtitles = action.payload;
    },
    setResolutions: (state, action) => {
      state.resolutions = action.payload;
    },
    setSelectedQuality: (state, action) => {
      state.selectedQuality = action.payload;
    },
    setSelectedSubtitle: (state, action) => {
      state.selectedSubtitle = action.payload;
    },
    setSelectedPlaybackSpeed: (state, action) => {
      state.selectedPlaybackSpeed = action.payload;
    },
    setCropHost: (state, action) => {
      state.cropHost = action.payload;
    },
    setConnection: (state, action) => {
      state.isConnected = action.payload;
    },
    setSelectedType: (state, action) => {
      state.selectedType = action.payload;
    },
    setIsProtectedModalOpen: (state, action) => {
      state.isProtectedModalOpen = action.payload;
    },
  },
});

export const {
  setCtrl,
  setIsOpenMainSidebar,
  setIsPlayerOpen,
  setIsMovieSearchBarOpen,
  setSubtitles,
  setResolutions,
  setSelectedQuality,
  setSelectedSubtitle,
  setSelectedPlaybackSpeed,
  setCropHost,
  setConnection,
  setSelectedType,
  setIsProtectedModalOpen,
} = globalSlice.actions;

export const selectCtrl = (state) => state.global.ctrl;
export const selectIsOpenMainSidebar = (state) =>
  state.global.isOpenMainSidebar;
export const selectIsPlayerOpen = (state) => state.global.isPlayerOpen;
export const selectIsMovieSearchBarOpen = (state) =>
  state.global.isMovieSearchBarOpen;
export const selectSubtitles = (state) => state.global.subtitles;
export const selectResolutions = (state) => state.global.resolutions;
export const selectSelectedQuality = (state) => state.global.selectedQuality;
export const selectSelectedSubtitle = (state) => state.global.selectedSubtitle;
export const selectSelectedPlaybackSpeed = (state) =>
  state.global.selectedPlaybackSpeed;
export const selectCropHost = (state) => state.global.cropHost;
export const selectIsConnected = (state) => state.global.isConnected;
export const selectSelectedType = (state) => state.global.selectedType;
export const selectIsProtectedModalOpen = (state) =>
  state.global.isProtectedModalOpen;
export default globalSlice.reducer;
