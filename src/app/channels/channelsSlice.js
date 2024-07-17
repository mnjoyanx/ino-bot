import { createSlice, current } from "@reduxjs/toolkit";

const initialState = {
  channels: {},
  allChannels: [],
  currentChannel: null,
};

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    setChannels: (state, action) => {
      state.channels = action.payload;
    },

    setAllChannels: (state, action) => {
      state.allChannels = action.payload;
    },

    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
  },
});

export const { setChannels } = channelsSlice.actions;
export const { setAllChannels } = channelsSlice.actions;
export const { setCurrentChannel } = channelsSlice.actions;

export const selectChannels = (state) => state.channels.channels;
export const selectAllChannels = (state) => state.channels.allChannels;
export const selectCurrentChannel = (state) => state.channels.currentChannel;

export default channelsSlice.reducer;
