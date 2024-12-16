import { InoSelect } from "@ino-ui/tv";
import { useDispatch, useSelector } from "react-redux";
import { setIsLangActive, selectIsLangActive } from "@app/global";

export default function Language({
  languages,
  selectedLanguage,
  changeLanguage,
}) {
  const dispatch = useDispatch();
  const isLangActive = useSelector(selectIsLangActive);

  return (
    <div className="info-settings parent-language">
      <InoSelect
        options={languages.map((lang) => ({
          label: lang.name,
          value: lang.id,
        }))}
        value={selectedLanguage.id}
        onChange={(id) => {
          const newLang = languages.find((l) => l.id === +id);
          localStorage.setItem("language", JSON.stringify(newLang));
          changeLanguage(newLang);
        }}
        isActive={isLangActive}
        onLeft={() => dispatch(setIsLangActive(false))}
      />
    </div>
  );
}
