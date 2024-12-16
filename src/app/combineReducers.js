import { combineReducers } from "redux";

import configsReducer from "./configs/configsSlice";
import channelsSlice from "./channels/channelsSlice";
import playerSlice from "./player/playerSlice";
import globalReducer from "./global";

const rootReducer = combineReducers({
  configs: configsReducer,
  channels: channelsSlice,
  player: playerSlice,
  global: globalReducer,
});

export default rootReducer;
