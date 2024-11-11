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
import { MoviesProvider } from "./context/moviesContext";
import AppsPage from "@pages/apps/Index.jsx";
import { selectIsPlayerOpen } from "@app/global";
import { useSelector } from "react-redux";
import "./styles/global.css";

const getVersion = () => {
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

  // req.open("GET", HOST + "js/version.json?time=" + Math.random(), true);
  req.open("GET", "version.json", true);
  req.send();

  setTimeout(function () {
    getVersion();
  }, 300000);
};

getVersion();

function App() {
  const isPlayerOpen = useSelector(selectIsPlayerOpen);

  useEffect(() => {
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
    <ToastProvider>
      <Routes>
        <Route path={PATHS.SPLASH_SCREEN} index element={<SplashScreen />} />
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
  );
}

export default memo(App);
