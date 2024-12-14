import { useTranslation } from "react-i18next";

export default function Network() {
  const { t } = useTranslation();

  return (
    <div className="parent-network info-settings">
      <p>
        {t("IP")}: {window.Android?.getIP() || "1:1:1:1"}
      </p>
      {window.Android?.getGateway ? (
        <p>
          {t("Gateway")}: {window.Android.getGateway()}
        </p>
      ) : null}
    </div>
  );
}
