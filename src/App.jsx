import { memo, useEffect, useMemo, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getApps, getAppSettings, setOnline } from "@server/requests";
import { selectIsPlayerOpen, setIsUpdateModalOpen } from "@app/global";
import { selectCurrentChannel } from "@app/channels/channelsSlice";
import "@ino-ui/tv/index.css";
import { InoButton, InoRow } from "@ino-ui/tv";

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
  }, 30000);
};

getVersion();

function App() {
  const dispatch = useDispatch();
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const currentChannel = useSelector(selectCurrentChannel);
  const onlineIntervalRef = useRef(null);
  const isConnected = useConnection();
  const [apkUrl, setApkUrl] = useState("");

  const [isApkModalOpen, setIsApkModalOpen] = useState(true);

  const getConfigs = async () => {
    const lang = JSON.parse(localStorage.getItem("language"));
    const langId = lang.id;
    const configs = await getAppSettings({
      languageId: langId,
    });
    const parsedConfigs = JSON.parse(configs);
    const { message } = parsedConfigs;

    dispatch(setAllSettings(message));
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
      console.log(appVersion, "----", version, "parsedRes", parsedRes);
      setApkUrl(apk);
      const realVersion = appVersion.slice(
        appVersion.indexOf("(") + 1,
        appVersion.indexOf(")"),
      );

      if (realVersion > version) {
        setIsApkModalOpen(true);
        dispatch(setIsUpdateModalOpen(true));
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
      console.log(message, "message");
    } else {
      localStorage.setItem(
        "parental_code",
        JSON.stringify(message.parental_code),
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
          body.channelId = currentChannel.id;
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
    console.log("uypdate");
    const splited = apkUrl.split("/");
    const fileName = splited[splited.length - 1];
    window.Android?.installApp(apkUrl, fileName);
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
  }, []);

  return (
    <>
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
            Close
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
            Update
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
            <Route path={PATHS.ACTIVATION_PAGE} element={<ActivationPage />} />
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

            {/* <Route path={PATHS.LOGIN} element={<Login imagesApp={imagesAppObj} />} />
              <Route path={PATHS.SUBUSERS} element={<Subusers imagesApp={imagesAppObj} />} />
              <Route path={PATHS.ADD_SUBUSER} element={<AddSubuser imagesApp={imagesAppObj} />} />
  
              <Route path={PATHS.ROOT} element={<MainLayout />}>
                  <Route path={PATHS.FAVORITES} element={<Favorite />} />
              </Route> */}
          </Routes>
        </ToastProvider>
      </InoToastProvider>
    </>
  );
}

export default memo(App);
