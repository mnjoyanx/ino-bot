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

function App() {
  useEffect(() => {
    const useResize = () => {
      let fontSize = 10; // 1rem = 10px (default) 1920x1080

      let k = window.innerWidth / 1920;

      fontSize = fontSize * k;

      console.log(fontSize, "size");

      document.documentElement.style.fontSize = fontSize + "px";
    };

    useResize();

    window.addEventListener("load", useResize);

    window.addEventListener("resize", useResize);

    return () => {
      window.removeEventListener("load", useResize);
      window.removeEventListener("resize", useResize);
    };
  }, []);

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
