import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  ctrl: "mainSidebar",
  isOpenMainSidebar: true,
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
  },
});

export const { setCtrl, setIsOpenMainSidebar } = globalSlice.actions;

export const selectCtrl = (state) => state.global.ctrl;
export const selectIsOpenMainSidebar = (state) =>
  state.global.isOpenMainSidebar;

export default globalSlice.reducer;
