import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  configs: {},
  profile: null,
};

const configsSlice = createSlice({
  name: "configs",
  initialState,
  reducers: {
    setConfigs: (state, action) => {
      state.configs = action.payload;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
});

export const { setConfigs } = configsSlice.actions;
export const { setProfile } = configsSlice.actions;

export const selectConfigs = (state) => state.configs.configs;
export const selectProfile = (state) => state.configs.profile;

export default configsSlice.reducer;
