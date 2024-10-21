import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ctrl: "",
  isOpenMainSidebar: false,
  isPlayerOpen: false,
  isMovieSearchBarOpen: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setCtrl: (state, action) => {
      console.log("setCtrl", action.payload);
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
  },
});

export const {
  setCtrl,
  setIsOpenMainSidebar,
  setIsPlayerOpen,
  setIsMovieSearchBarOpen,
} = globalSlice.actions;

export const selectCtrl = (state) => state.global.ctrl;
export const selectIsOpenMainSidebar = (state) =>
  state.global.isOpenMainSidebar;
export const selectIsPlayerOpen = (state) => state.global.isPlayerOpen;
export const selectIsMovieSearchBarOpen = (state) =>
  state.global.isMovieSearchBarOpen;

export default globalSlice.reducer;
