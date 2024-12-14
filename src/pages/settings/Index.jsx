import { useDispatch, useSelector } from "react-redux";
import { setProfile, selectProfile } from "@app/configs/configsSlice";
import { getProfile } from "@server/requests";
import HeadSettings from "@components/settings/HeadSettings";
import SettingsWrapper from "@components/settings/SettingsWrapper";

import "@styles/components/settings.scss";
import { useEffect } from "react";

export default function Settings() {
  const dispatch = useDispatch();

  const profile = useSelector(selectProfile);

  useEffect(() => {
    if (!profile) reqGetProfile();
  }, []);

  const reqGetProfile = async () => {
    const response = await getProfile({});
    const parsedResponse = JSON.parse(response);
    const { error, message } = parsedResponse;

    if (error) {
      dispatch(setProfile(null));
    } else {
      dispatch(setProfile(message));
      localStorage.setItem("userLangId", JSON.stringify(message.languageId));
    }
  };
  return (
    <div id="settings">
      <HeadSettings />
      <SettingsWrapper />
    </div>
  );
}
