import { combineReducers } from "redux";

import configsReducer from "./configs/configsSlice";
import channelsSlice from "./channels/channelsSlice";

const rootReducer = combineReducers({
  configs: configsReducer,
  channels: channelsSlice,
});

export default rootReducer;
