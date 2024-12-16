import { useSelector } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import LOCAL_STORAGE from "@utils/localStorage";

const AppLogo = () => {
  const configs = useSelector(selectConfigs);

  return (
    <div className="logo">
      {configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET() ? (
        <img
          src={configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET()}
          alt="logo"
        />
      ) : null}
    </div>
  );
};

export default AppLogo;
