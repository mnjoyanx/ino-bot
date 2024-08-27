import { useSelector } from "react-redux";
import { selectProfile } from "@app/configs/configsSlice";
import { formatDate } from "@utils/util";

import LOCAL_STORAGE from "@utils/localStorage";

export default function Account() {
  const profile = useSelector(selectProfile);

  console.log(profile);
  return (
    <div className="parent-account info-settings">
      {/* name  */}
      <p>NAME: {profile?.name}</p>
      {/* Mac address  */}
      <p>MAC: {LOCAL_STORAGE.MAC_ADDRESS.GET()}</p>
      {/* profile?.expire_tariff */}
      {profile?.expire_tariff ? (
        <p>
          Expiration Date{" "}
          {formatDate(
            new Date(new Date(profile?.expire_tariff).getTime()),
            "dd/MM/yyyy"
          )}
        </p>
      ) : null}
    </div>
  );
}
