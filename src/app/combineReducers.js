import { combineReducers } from "redux";

import configsReducer from "./configs/configsSlice";
import channelsSlice from "./channels/channelsSlice";
import playerSlice from "./player/playerSlice";

const rootReducer = combineReducers({
  configs: configsReducer,
  channels: channelsSlice,
  player: playerSlice,
});

export default rootReducer;
