import { createSlice, current } from "@reduxjs/toolkit";

const initialState = {
  channels: {},
  allChannels: [],
  currentChannel: null,
  playerType: "live", // live,archive or timeshift
  selectedCategory: "All",
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

    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },

    toggleFavorite: (state, action) => {
      const channelId = action.payload;

      // Update in categories
      Object.keys(state.channels).forEach((categoryKey) => {
        state.channels[categoryKey].content = state.channels[
          categoryKey
        ].content.map((channel) => {
          if (channel.id === channelId) {
            return { ...channel, is_favorite: !channel.is_favorite };
          }
          return channel;
        });
      });

      // Update in allChannels if you're using it
      if (state.allChannels) {
        state.allChannels = state.allChannels.map((channel) => {
          if (channel.id === channelId) {
            return { ...channel, is_favorite: !channel.is_favorite };
          }
          return channel;
        });
      }
    },
  },
});

export const { setChannels } = channelsSlice.actions;
export const { setAllChannels } = channelsSlice.actions;
export const { setCurrentChannel } = channelsSlice.actions;
export const { setPlayerType } = channelsSlice.actions;
export const { toggleFavorite } = channelsSlice.actions;
export const { setSelectedCategory } = channelsSlice.actions;
export const selectChannels = (state) => state.channels.channels;
export const selectAllChannels = (state) => state.channels.allChannels;
export const selectCurrentChannel = (state) => state.channels.currentChannel;
export const selectPlayerType = (state) => state.channels.playerType;
export const selectSelectedCategory = (state) =>
  state.channels.selectedCategory;
export default channelsSlice.reducer;
