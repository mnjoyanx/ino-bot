import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppLogo from "@components/common/AppLogo";
import BackButton from "@components/common/BackButton";
import { selectCtrl, setCtrl } from "@app/global";
import { GridView, toast } from "@ino-ui/tv";
import { getApps } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";
import Loading from "@components/common/Loading";
import { useTranslation } from "react-i18next";

import styles from "@styles/components/appsPage.module.scss";
import AppBgSvg from "@assets/icons/AppBgSvg";

export default function AppsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const ctrl = useSelector(selectCtrl);
  const [isAndroid, setIsAndroid] = useState(false);

  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAppsHandler = async () => {
    try {
      setIsLoading(true);
      const res = await getApps({
        device_id: LOCAL_STORAGE.MAC_ADDRESS.GET(),
      });

      const parsedRes = JSON.parse(res);

      if (!parsedRes.error) {
        setApps(parsedRes.message);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAppsHandler();

    if (window.Android) {
      setIsAndroid(true);
    } else {
      dispatch(setCtrl("backBtn"));
    }
  }, []);

  return (
    <div className={styles["apps-page"]}>
      {isLoading ? (
        <div className={styles["loading-container"]}>
          <Loading />
        </div>
      ) : (
        <>
          <BackButton
            path="Menu"
            onDownHandler={() => {
              if (!window.Android) return;
              dispatch(setCtrl("apps"));
            }}
            onBackHandler={() => {
              navigate("/menu");
            }}
          />
          <div className="app-logo">
            <AppLogo classNames={"app-logo_top"} />
          </div>
          <div className={styles["apps-content"]}>
            <h2 className={styles["apps-title"]}>{t("Apps Launcher")}</h2>
            {!isAndroid ? (
              <div className={styles["grid-view_container"]}>
                <GridView
                  id="apps-grid"
                  uniqueKey="app-"
                  nativeControle={true}
                  rowItemsCount={3}
                  rowCount={Math.ceil(apps.length / 3)}
                  bufferStart={10}
                  bufferEnd={10}
                  itemWidth={35}
                  itemHeight={24.5}
                  isActive={ctrl !== "backBtn"}
                  onOk={(item) => {
                    if (item?.app_id) {
                      const res = window.Android.launchApp(item.app_id);
                      if (!res) {
                        toast.error("Failed to launch app");
                      }
                    }
                  }}
                  initialActiveIndex={0}
                  onChangeRow={() => {}}
                  onUp={() => dispatch(setCtrl("backBtn"))}
                  onDown={() => {}}
                  onBack={() => {
                    navigate("/menu");
                  }}
                  //   onBackScrollIndex={0}
                  renderItem={({ item, index, style, isActive }) => (
                    <div
                      style={style}
                      className={`${styles["app-item"]} ${isActive ? styles["active"] : ""}`}
                    >
                      <img
                        src={item.icon || LOCAL_STORAGE.LOGO.GET()}
                        alt={item.name}
                        className={styles["image"]}
                      />
                      {isActive && (
                        <span className={styles["name"]}>{t(item.name)}</span>
                      )}
                    </div>
                  )}
                  data={apps}
                />
              </div>
            ) : (
              <p className={styles["android-only"]}>
                {t("This feature is only available on Android devices")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
