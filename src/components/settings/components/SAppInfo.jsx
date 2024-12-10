import LOCAL_STORAGE from "@utils/localStorage";

export default function AppInfo({ description, companyName }) {
  const appVersion = localStorage.getItem("app_version");

  return (
    <div className="info-settings parent-app-info">
      <p>{companyName}</p>
      <p>{LOCAL_STORAGE.DEVICE_OS.GET()}</p>
      <p>App Version: {appVersion}</p>

      <span>{description}</span>
    </div>
  );
}
