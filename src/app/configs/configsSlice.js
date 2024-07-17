import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    configs: {},
};

const configsSlice = createSlice({
    name: "configs",
    initialState,
    reducers: {
        setConfigs: (state, action) => {
            state.configs = action.payload;
        },
    },
});

export const { setConfigs } = configsSlice.actions;

export const selectConfigs = (state) => state.configs.configs;

export default configsSlice.reducer;