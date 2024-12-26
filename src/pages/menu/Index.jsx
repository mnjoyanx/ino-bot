import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import { setPlayerType } from "@app/channels/channelsSlice";

import TimeWrapper from "@components/splash-screen/TimeWrapper";
import NetworkStatus from "@components/splash-screen/NetworkStatus";
import MenuItems from "@components/menu/MenuItems";

import LOCAL_STORAGE from "@utils/localStorage";

import "@styles/components/menu.scss";
import AppLogo from "@components/common/AppLogo";

export default function Menu() {
  const dispatch = useDispatch();
  const configs = useSelector(selectConfigs);

  useEffect(() => {
    dispatch(setPlayerType("live"));
    localStorage.removeItem("lastIndex");
    localStorage.removeItem("lastRow");
  }, []);

  return (
    <div className="menu-wrapper">
      <div className="head-menu-wrapper">
        <TimeWrapper />
        <AppLogo />
        <NetworkStatus />
      </div>
      <MenuItems />
    </div>
  );
}
