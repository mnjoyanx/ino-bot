import { memo, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import PATHS from "@utils/paths.js";

import SplashScreen from "@pages/splash-screen/Index.jsx";
import ActivationPage from "@pages/activationPage/Index.jsx";
import Menu from "@pages/menu/Index.jsx";
import LivePage from "@pages/live/Index.jsx";
import Settings from "@pages/settings/Index.jsx";

function App() {
  return (
    <Routes>
      <Route path={PATHS.SPLASH_SCREEN} index element={<SplashScreen />} />
      <Route path={PATHS.MENU} element={<Menu />} />
      <Route path={PATHS.ACTIVATION_PAGE} element={<ActivationPage />} />
      <Route path={PATHS.LIVE} element={<LivePage />} />
      <Route path={PATHS.SETTINGS} element={<Settings />} />
      {/* <Route path={PATHS.LOGIN} element={<Login imagesApp={imagesAppObj} />} />
            <Route path={PATHS.SUBUSERS} element={<Subusers imagesApp={imagesAppObj} />} />
            <Route path={PATHS.ADD_SUBUSER} element={<AddSubuser imagesApp={imagesAppObj} />} />

            <Route path={PATHS.ROOT} element={<MainLayout />}>
                <Route path={PATHS.FAVORITES} element={<Favorite />} />
            </Route> */}
    </Routes>
  );
}

export default memo(App);
