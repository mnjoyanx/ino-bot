export default function Language() {
  const language = JSON.parse(localStorage.getItem("language"));
  return (
    <div className="info-settings parent-language">
      <img src={language.icon} className="settings-lang_icon" />
      <p className="lang-name">{language.name}</p>
    </div>
  );
}
