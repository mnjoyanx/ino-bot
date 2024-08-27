import LOCAL_STORAGE from "@utils/localStorage";

export default function Network() {
  return (
    <div className="parent-network info-settings">
      <p>IP: {LOCAL_STORAGE.DEVICE_IP.GET() || "1:1:1:1"}</p>
      <p>GETWAY: {LOCAL_STORAGE.DEVICE_IP.GET() || "1:1:1:1"}</p>
      {/* <p>MAS {"255:255:255:0"}</p>
      <p>DNS {"8.8.8.8"}</p> */}
    </div>
  );
}
