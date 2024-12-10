export default function Network() {
  return (
    <div className="parent-network info-settings">
      <p>IP: {window.Android?.getIP() || "1:1:1:1"}</p>
      {window.Android?.getGateway ? (
        <p>GETWAY: {window.Android.getGateway()}</p>
      ) : null}
    </div>
  );
}
