import { memo, useEffect, useMemo, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import os from "@utils/os.js";

import {
  getApps,
  getAppSettings,
  getCurrentTranslations,
  getTranslations,
  setOnline,
} from "@server/requests";
import { selectIsPlayerOpen, setIsUpdateModalOpen } from "@app/global";
import { selectCurrentChannel } from "@app/channels/channelsSlice";
// import "@ino-ui/tv/index.css";
import { InoButton, InoRow } from "@ino-ui/tv";
import { useTranslation } from "react-i18next";
import TranslationProvider from "./TranslationProvider";

import PATHS from "@utils/paths.js";

import SplashScreen from "@pages/splash-screen/Index.jsx";
import ActivationPage from "@pages/activationPage/Index.jsx";
import Menu from "@pages/menu/Index.jsx";
import LivePage from "@pages/live/Index.jsx";
import Settings from "@pages/settings/Index.jsx";
import MoviesPage from "@pages/movies/Index.jsx";
import MovieInfo from "@pages/movieInfo/Index.jsx";
import { ToastProvider } from "./hooks/useToast";
import { ToastProvider as InoToastProvider } from "@ino-ui/tv";
import useConnection from "./hooks/useConnection";
import { MoviesProvider } from "./context/moviesContext";
import AppsPage from "@pages/apps/Index.jsx";
import { Modal } from "@ino-ui/tv";
import "./styles/global.css";
import { validateToken } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";
import { setAllSettings, setConfigs } from "@app/configs/configsSlice";

window.setRequestResult = (url, code, response) => {
  if (code == 200) {
    const sriptEl = document.getElementById("bundlejs");
    const hostUrl =
      sriptEl.src.split("bundle.js")[0] + "version.js/?" + Date.now();
    if (url === hostUrl) {
      console.log(JSON.parse(atob(response)), "atob get res", url);
    }
  } else {
    console.log(code, response);
  }
};

const getVersion = () => {
  if (window.Android) {
    // const version = window.Android.getAppVersion();
    // localStorage.setItem("app_version", version);
    const sriptEl = document.getElementById("bundlejs");
    const hostUrl =
      sriptEl.src.split("bundle.js")[0] + "version.js/?" + Date.now();
    window.Android.getFromUrlB64(hostUrl);
    console.log(hostUrl, "host url", window.Android.getFromUrlB64(hostUrl));
    // console.log(versionUrl, "version url");
  } else {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let data = JSON.parse(this.responseText);

        let VERSION = data.version;

        if (localStorage.getItem("app_version") == VERSION) {
          localStorage.setItem("app_version", VERSION);
        } else {
          localStorage.setItem("app_version", VERSION);
          if (window.Android) {
            window.Android.reload();
          } else {
            window.location.reload();
          }
        }
      }
    };
    req.onerror = function () {};

    let host = "";
    const sriptEl = document.getElementById("bundlejs");
    if (sriptEl) {
      host = sriptEl.src.split("bundle.js")[0];
    }
    req.open("GET", host + "/version.json", true);
    req.send();
  }

  setTimeout(function () {
    getVersion();
  }, 300000);
};

getVersion();

function App() {
  const dispatch = useDispatch();
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const currentChannel = useSelector(selectCurrentChannel);
  const onlineIntervalRef = useRef(null);
  const isConnected = useConnection();
  const [apkUrl, setApkUrl] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  const getConfigs = async () => {
    try {
      const lang = JSON.parse(localStorage.getItem("language"));

      if (lang) {
        const langId = lang.id;
        const configs = await getAppSettings({
          languageId: langId,
        });
        const parsedConfigs = JSON.parse(configs);
        const { message } = parsedConfigs;

        dispatch(setAllSettings(message));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getAppsHandler = async () => {
    try {
      const res = await getApps({
        device_id: LOCAL_STORAGE.MAC_ADDRESS.GET(),
      });

      const parsedRes = JSON.parse(res);
      const version = parsedRes.message[0].version_string;
      const appId = parsedRes.message[0].app_id;
      const apk = parsedRes.message[0].apk;
      const appVersion = window.Android.getAppVersion(appId);
      setApkUrl(apk);
      const realVersion = appVersion.slice(
        appVersion.indexOf("(") + 1,
        appVersion.indexOf(")")
      );

      if (realVersion < version) {
        if (window.Android) {
          setIsApkModalOpen(true);
          dispatch(setIsUpdateModalOpen(true));
        } else {
          setIsApkModalOpen(false);
          dispatch(setIsUpdateModalOpen(false));
        }
      } else {
        setIsApkModalOpen(false);
        dispatch(setIsUpdateModalOpen(false));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleValidateToken = async () => {
    const token = LOCAL_STORAGE.TOKEN.GET();
    const response = await validateToken({ token });
    const parsedResponse = JSON.parse(response);
    const { message, error } = parsedResponse;
    if (error) {
      navigate("/");
    } else {
      localStorage.setItem(
        "parental_code",
        JSON.stringify(message.parental_code)
      );
    }
  };

  const sendOnlineStatus = async () => {
    try {
      const body = {
        isLive: false,
      };

      const pathname = window.location.href;
      const isLiveContent = pathname.includes("/live");

      body.isLive = isLiveContent;
      if (isPlayerOpen) {
        if (pathname.includes("/live")) {
          body.channelId = currentChannel?.id;
        } else {
          body.movieId = pathname.split("/").pop();
        }
      }

      await setOnline(body);
    } catch (error) {
      console.error("Failed to send online status:", error);
    }
  };

  const updateApkHandler = () => {
    const splited = apkUrl.split("/");
    const fileName = splited[splited.length - 1];
    window.Android?.installApp(apkUrl, fileName);
  };

  const getCurrentTranslationsHandler = async (lang) => {
    try {
      const res = await getCurrentTranslations({ id: lang.id });
      const parsedRes = JSON.parse(res);
      const { message } = parsedRes;
      console.log(message, "parseeee lang translation", lang);
    } catch (err) {
      console.log(err);
    }
  };

  const getTranslationsHandler = async () => {
    try {
      const res = await getTranslations();
      const parsedRes = JSON.parse(res);
      const { message } = parsedRes;

      // const defaultLang = message.find((item) => item.default);
      const defaultLangId = JSON.parse(localStorage.getItem("userLangId"));
      const defaultLang = message.find((item) => +item.id === +defaultLangId);

      if (defaultLang) {
        getCurrentTranslationsHandler(defaultLang);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    sendOnlineStatus();

    onlineIntervalRef.current = setInterval(sendOnlineStatus, 120000);

    return () => {
      if (onlineIntervalRef.current) {
        clearInterval(onlineIntervalRef.current);
      }
    };
  }, [isPlayerOpen, currentChannel?.id]);

  useEffect(() => {
    if (window.Android) {
      getAppsHandler();
    }
    // getTranslationsHandler();
  }, []);

  useEffect(() => {
    handleValidateToken();
    if (window.Android) {
      if (isPlayerOpen) {
        document.body.classList.add("playing");
      } else {
        document.body.classList.remove("playing");
        if (window.Android) {
          window.Android.destroyPlayer();
        }
      }
    }
  }, [isPlayerOpen]);

  useEffect(() => {
    getConfigs();
    if (window.Android) {
      os(() => {});
    }
  }, []);

  const langId = JSON.parse(localStorage.getItem("language"))?.id;

  return (
    <>
      <TranslationProvider langId={langId}>
        <Modal
          isOpen={!isConnected}
          onClose={() => {}}
          size="full"
          classNames="connection-modal"
        >
          <h2 className="no-interen-title">No internet connection</h2>
          <p>Please check your internet connection and try again</p>
        </Modal>
        <Modal isOpen={isApkModalOpen} onClose={() => {}} size="full">
          <h2 className="no-interen-title">There is a new version available</h2>

          <InoRow isActive={true} classNames="apk-update_row">
            <InoButton
              isActive
              variant="outline"
              size="large"
              classNames="apk-update_btn close"
              onClick={() => {
                setIsApkModalOpen(false);
                dispatch(setIsUpdateModalOpen(false));
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
                updateApkHandler();
                setIsApkModalOpen(false);
                dispatch(setIsUpdateModalOpen(false));
              }}
            >
              {t("Update")}
            </InoButton>
          </InoRow>
        </Modal>
        <InoToastProvider>
          <ToastProvider>
            <Routes>
              <Route
                path={PATHS.SPLASH_SCREEN}
                index
                element={<SplashScreen />}
              />
              <Route path={PATHS.MENU} element={<Menu />} />
              <Route
                path={PATHS.ACTIVATION_PAGE}
                element={<ActivationPage />}
              />
              <Route path={PATHS.LIVE} element={<LivePage />} />
              <Route path={PATHS.SETTINGS} element={<Settings />} />

              <Route
                path={PATHS.MOVIES}
                element={
                  <MoviesProvider>
                    <MoviesPage />
                  </MoviesProvider>
                }
              />
              <Route path={PATHS.MOVIE_INFO} element={<MovieInfo />} />

              <Route path={PATHS.APPS} element={<AppsPage />} />
            </Routes>
          </ToastProvider>
        </InoToastProvider>
      </TranslationProvider>
    </>
  );
}

export default memo(App);
