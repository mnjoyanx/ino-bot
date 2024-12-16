import { createSlice, current } from "@reduxjs/toolkit";

const initialState = {
  channels: {},
  allChannels: [],
  currentChannel: null,
  playerType: "live", // live,archive or timeshift
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

    setPlayerType: (state, action) => {
      state.playerType = action.payload;
    },
  },
});

export const { setChannels } = channelsSlice.actions;
export const { setAllChannels } = channelsSlice.actions;
export const { setCurrentChannel } = channelsSlice.actions;
export const { setPlayerType } = channelsSlice.actions;

export const selectChannels = (state) => state.channels.channels;
export const selectAllChannels = (state) => state.channels.allChannels;
export const selectCurrentChannel = (state) => state.channels.currentChannel;
export const selectPlayerType = (state) => state.channels.playerType;

export default channelsSlice.reducer;
