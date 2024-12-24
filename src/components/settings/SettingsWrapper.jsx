import { memo, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLangActive, setIsLangActive } from "@app/global";
import PATHS from "@utils/paths.js";
import { useTranslation } from "react-i18next";
import LOCAL_STORAGE from "@utils/localStorage";

import useKeydown from "@hooks/useKeydown";
import { selectAllSettings, setAllSettings } from "@app/configs/configsSlice";

import Item from "./components/ItemSettings";

import SAccount from "./components/SAccount";
import SNetwork from "./components/SNetwork";
import SLanguage from "./components/SLanguage";
import SAppInfo from "./components/SAppInfo";

import "./styles/SettingsWrapper.scss";
import {
  changeLang,
  getAppSettings,
  getLanguages,
  getApps,
} from "@server/requests";
import Loading from "@components/common/Loading";
import { InoButton, InoRow, Modal } from "@ino-ui/tv";

export default function SettingsWrapper({ children }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const appData = useSelector(selectAllSettings);

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [ctrl, setCtrl] = useState("items");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [list, setList] = useState([]);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isLastVersion, setIsLastVersion] = useState(false);
  const [apkUrl, setApkUrl] = useState("");
  const [checkUpdatesLoading, setCheckUpdatesLoading] = useState(false);

  const isLangActive = useSelector(selectIsLangActive);

  useKeydown({
    isActive: ctrl === "items" && !isLangActive && !isApkModalOpen,

    back: () => {
      navigate(PATHS.MENU);
    },

    up: () => {
      if (active === 0) return;

      setActive(active - 1);
    },

    right: () => {
      if (active === 2) {
        setCtrl("lang");
        dispatch(setIsLangActive(true));
      }
    },

    ok: () => {
      if (active === 1) {
        console.log("ok");
      }
    },

    down: () => {
      if (active === list.length - 1) {
        setCtrl("checkUpdates");
        return;
      }

      setActive(active + 1);
    },
  });

  const getConfigs = async (lang) => {
    setIsLoading(true);
    try {
      const langId = lang.id;
      const configs = await getAppSettings({
        languageId: langId,
      });
      const parsedConfigs = JSON.parse(configs);
      const { message } = parsedConfigs;

      dispatch(setAllSettings(message));
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguagesHandler = async () => {
    try {
      const lngs = await getLanguages();
      const parsedLanguages = JSON.parse(lngs);
      const { message } = parsedLanguages;

      setLanguages(message);

      const defaultLanguageId = JSON.parse(localStorage.getItem("userLangId"));
      const defaultLanguage = message.find(
        (item) => +item.id === +defaultLanguageId
      );
      setSelectedLanguage(defaultLanguage);
    } catch (err) {
      console.log(err);
    }
  };

  const changeLanguageHandler = async (lang) => {
    try {
      const langId = lang.id;
      const configs = await changeLang({
        languageId: langId,
      });
      const parsedConfigs = JSON.parse(configs);
      const { message } = parsedConfigs;

      dispatch(setAllSettings(message));
      localStorage.setItem("userLangId", JSON.stringify(langId));
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  const getAppsHandler = async () => {
    setCheckUpdatesLoading(true);
    try {
      const res = await getApps({
        device_id: LOCAL_STORAGE.MAC_ADDRESS.GET(),
      });

      const parsedRes = JSON.parse(res);
      const version = parsedRes.message[0].version_string;
      const appId = parsedRes.message[0].app_id;
      const apk = parsedRes.message[0].apk;
      const appVersion = window.Android?.getAppVersion(appId);

      setApkUrl(apk);
      const realVersion = appVersion.slice(
        appVersion.indexOf("(") + 1,
        appVersion.indexOf(")")
      );

      if (realVersion < version) {
        if (window.Android) {
          setIsLastVersion(false);
        } else {
          setIsLastVersion(true);
        }
      } else {
        setIsLastVersion(true);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setCheckUpdatesLoading(false);
    }
  };

  const updateApkHandler = async () => {
    const appsRes = await getAppsHandler();
    const splited = apkUrl.split("/");
    const fileName = splited[splited.length - 1];
    window.Android?.installApp(apkUrl, fileName);
  };

  useEffect(() => {
    getLanguagesHandler();
  }, []);

  useEffect(() => {
    if (!isLangActive) {
      setCtrl("items");
    }
  }, [isLangActive]);

  useEffect(() => {
    if (!selectedLanguage) return;

    if (!appData) {
      getConfigs(selectedLanguage);
    } else {
      setList([
        {
          id: 0,
          title: t("Account"),
          component: <SAccount data={appData.basics?.[0]} />,
        },
        { id: 1, title: t("Network"), component: <SNetwork /> },
        {
          id: 2,
          title: t("Language"),
          component: (
            <SLanguage
              languages={languages}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              changeLanguage={changeLanguageHandler}
            />
          ),
        },
        {
          id: 4,
          title: t("App Info"),
          component: (
            <SAppInfo
              description={appData.basics?.[0]?.description}
              companyName={appData.basics?.[0]?.company_name}
            />
          ),
        },
      ]);
    }
  }, [appData, selectedLanguage]);

  const onMouseEnter = useCallback((index) => setActive(index), []);

  return (
    <>
      <Modal isOpen={isApkModalOpen} onClose={() => {}} size="full">
        {checkUpdatesLoading ? (
          <Loading />
        ) : (
          <>
            <h2 className="no-interen-title">
              {!isLastVersion
                ? t("There is a new version available")
                : t("You have the latest version")}
            </h2>

            <InoRow isActive={true} classNames="apk-update_row">
              <InoButton
                isActive
                variant="outline"
                size="large"
                classNames="apk-update_btn close"
                onClick={() => {
                  setIsApkModalOpen(false);
                }}
              >
                {t("Close")}
              </InoButton>
              <InoButton
                isActive
                size="large"
                variant="outline"
                classNames="apk-update_btn update"
                onClick={() => {
                  setIsApkModalOpen(false);
                  updateApkHandler();
                }}
              >
                {t("Update")}
              </InoButton>
            </InoRow>
          </>
        )}
      </Modal>

      {isLoading || !list.length ? (
        <div className="settings-loader">
          <Loading />
        </div>
      ) : (
        <>
          <div className="settings-wrapper">
            <>
              <div className="list-settings">
                {list.map((item, index) => {
                  return (
                    <Item
                      key={item.id}
                      index={index}
                      title={item.title}
                      isActive={index === active && ctrl === "items"}
                      onMouseEnter={onMouseEnter}
                    />
                  );
                })}
              </div>
              <div className="parent-info-settings">
                {list[active].component}
              </div>
            </>
          </div>

          <div className="app-settings_actions_row">
            <InoButton
              isActive={ctrl === "checkUpdates"}
              onUp={() => setCtrl("items")}
              onClick={() => {
                // const url = window.location.href;
                // const updateUrl = url.replace("/settings", "/menu");
                // window.location.href = updateUrl;
                // window.location.reload();
                setIsApkModalOpen(true);
                getAppsHandler();
              }}
              onBack={() => navigate("/menu")}
              size="large"
              classNames="reload-btn updates-btn"
              variant="outline"
              onRight={() => setCtrl("reload")}
            >
              {t("Check for updates")}
            </InoButton>
            <InoButton
              isActive={ctrl === "reload"}
              onUp={() => setCtrl("items")}
              onClick={() => {
                const url = window.location.href;
                const updateUrl = url.replace("/settings", "/menu");
                window.location.href = updateUrl;
                window.location.reload();
              }}
              onBack={() => navigate("/menu")}
              size="large"
              classNames="reload-btn"
              variant="outline"
              onLeft={() => setCtrl("checkUpdates")}
            >
              {t("Reload")}
            </InoButton>
          </div>
        </>
      )}
    </>
  );
}
