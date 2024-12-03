import { memo, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

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
import { selectIsPlayerOpen } from "@app/global";
import { useSelector } from "react-redux";
import { Modal } from "@ino-ui/tv";
import "./styles/global.css";
import { validateToken } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

const getVersion = () => {
  if (window.Android) {
    const version = window.Android.getAppVersion();
    localStorage.setItem("app_version", version);
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
  const isPlayerOpen = useSelector(selectIsPlayerOpen);
  const isConnected = useConnection();

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
