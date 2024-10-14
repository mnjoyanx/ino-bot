import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ctrl: "mainSidebar",
  isOpenMainSidebar: true,
  isPlayerOpen: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setCtrl: (state, action) => {
      state.ctrl = action.payload;
    },
    setIsOpenMainSidebar: (state, action) => {
      state.isOpenMainSidebar = action.payload;
    },
    setIsPlayerOpen: (state, action) => {
      state.isPlayerOpen = action.payload;
    },
  },
});

export const { setCtrl, setIsOpenMainSidebar, setIsPlayerOpen } =
  globalSlice.actions;

export const selectCtrl = (state) => state.global.ctrl;
export const selectIsOpenMainSidebar = (state) =>
  state.global.isOpenMainSidebar;
export const selectIsPlayerOpen = (state) => state.global.isPlayerOpen;

export default globalSlice.reducer;
