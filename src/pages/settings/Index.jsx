import HeadSettings from "@components/settings/HeadSettings";
import SettingsWrapper from "@components/settings/SettingsWrapper";

import "@styles/components/settings.scss";

export default function Settings() {
  return (
    <div id="settings">
      <HeadSettings />
      <SettingsWrapper />
    </div>
  );
}
