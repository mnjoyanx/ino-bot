import { memo } from "react";

import useKeydown from "@hooks/useKeydown";
import { useTranslation } from "react-i18next";
import SvgSearch from "@assets/images/live/SvgSearch";

export default memo(function SearchHandler({
  isActive,
  control,
  setControl,
  onClick,
}) {
  const { t } = useTranslation();
  useKeydown({
    isActive: control,

    ok: () => onClick(),
    down: () => {
      setControl("category");
    },
  });
  return (
    <div className={"search-handler"} onClick={onClick}>
      <div className={`main_search${isActive ? " active" : ""}`}>
        <SvgSearch />
        <p>{t("Search")}</p>
      </div>
    </div>
  );
});
