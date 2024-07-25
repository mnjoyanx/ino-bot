import LOCAL_STORAGE from "@utils/localStorage";

export default function AppInfo() {
  return (
    <div className="info-settings parent-app-info">
      <p>InoRain OTT v2</p>
      <p>{LOCAL_STORAGE.DEVICE_OS.GET()} 2GB RAM. (SD v23423)</p>
      <span>
        There are many variations of passages of Lorem Ipsum available, but the
        majority have suffered alteration in some form, by injected humour, or
        randomised words which don't look even slightly believable.
      </span>
    </div>
  );
}
