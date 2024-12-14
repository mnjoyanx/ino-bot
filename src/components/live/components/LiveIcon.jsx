import { memo } from "react";
import { useTranslation } from "react-i18next";

export default memo(function LiveIcon({ type, isActive = false }) {
  const { t } = useTranslation();
  return (
    <div className={`live-icon ${type}${isActive ? " active" : ""}`}>
      {t("LIVE")}
    </div>
  );
});
