import LOCAL_STORAGE from "@utils/localStorage";

export default function Account() {
  return (
    <div className="parent-account info-settings">
      {/* name  */}
      <p>Armen Hakobyan</p>
      {/* Mac address  */}
      <p>MAC: {LOCAL_STORAGE.MAC_ADDRESS.GET()}</p>
      {/* Expiration Date  */}
      <p>Expiration Date 06\06\2024</p>
      <p>Expiration Date 06\06\2024</p>
    </div>
  );
}
