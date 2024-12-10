import { formatDate } from "@utils/util";

import LOCAL_STORAGE from "@utils/localStorage";

export default function Account({ data }) {
  return (
    <div className="parent-account info-settings">
      {/* name  */}
      <p>NAME: {data.app_name}</p>
      {/* Mac address  */}
      <p>MAC: {LOCAL_STORAGE.MAC_ADDRESS.GET()}</p>
    </div>
  );
}
