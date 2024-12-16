import LOCAL_STORAGE from "@utils/localStorage";

import TimeWrapper from "@components/splash-screen/TimeWrapper";

import "./styles/HeadSettings.scss";

export default function HeadSettings() {
  return (
    <div className="head-settings">
      <TimeWrapper />
      <div className="logo-settings">
        <img src={LOCAL_STORAGE.LOGO.GET()} alt="logo" />
      </div>
    </div>
  );
}
