import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AppLogo from "@components/common/AppLogo";
import BackButton from "@components/common/BackButton";
import { selectCtrl, setCtrl } from "@app/global";
import { GridView } from "ino-ui-tv";
import { getApps } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";
import Loading from "@components/common/Loading";

import styles from "@styles/components/appsPage.module.scss";

export default function AppsPage() {
  const dispatch = useDispatch();
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
              dispatch(setCtrl("apps"));
            }}
          />
          <div className="app-logo">
            <AppLogo />
          </div>
          <div className={styles["apps-content"]}>
            <h2 className={styles["apps-title"]}>Apps Launcher</h2>
            {isAndroid ? (
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
                  itemHeight={25}
                  isActive={ctrl !== "backBtn"}
                  onOk={(item) => {
                    if (item?.app_id) {
                      window.Android.launchApp(item.app_id);
                    }
                  }}
                  initialActiveIndex={0}
                  //   onMouseEnter={() => {}}

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
                        <span className={styles["name"]}>{item.name}</span>
                      )}
                    </div>
                  )}
                  data={apps}
                />
              </div>
            ) : (
              <p>This feature is only available on Android devices</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
