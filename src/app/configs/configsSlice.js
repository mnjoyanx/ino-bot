import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  configs: {},
  profile: null,
  allSettings: null,
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

    setAllSettings: (state, action) => {
      state.allSettings = action.payload;
    },
  },
});

export const { setConfigs } = configsSlice.actions;
export const { setProfile } = configsSlice.actions;
export const { setAllSettings } = configsSlice.actions;

export const selectConfigs = (state) => state.configs.configs;
export const selectProfile = (state) => state.configs.profile;
export const selectAllSettings = (state) => state.configs.allSettings;

export default configsSlice.reducer;
