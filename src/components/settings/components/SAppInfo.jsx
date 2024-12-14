import LOCAL_STORAGE from "@utils/localStorage";
import { useTranslation } from "react-i18next";

export default function AppInfo({ description, companyName }) {
  const { t } = useTranslation();

  const appVersion = localStorage.getItem("app_version");

  return (
    <div className="info-settings parent-app-info">
      <p>{t(companyName)}</p>
      <p>{LOCAL_STORAGE.DEVICE_OS.GET()}</p>
      <p>
        {t("App Version")}: {appVersion}
      </p>

      <span>{description}</span>
    </div>
  );
}
