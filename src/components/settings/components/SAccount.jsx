import { formatDate } from "@utils/util";
import { useTranslation } from "react-i18next";

import LOCAL_STORAGE from "@utils/localStorage";

export default function Account({ data }) {
  const { t } = useTranslation();

  return (
    <div className="parent-account info-settings">
      {/* name  */}
      <p>
        {t("Name")}: {data.app_name}
      </p>
      {/* Mac address  */}
      <p>
        {t("Mac Address")}: {LOCAL_STORAGE.MAC_ADDRESS.GET()}
      </p>
    </div>
  );
}
