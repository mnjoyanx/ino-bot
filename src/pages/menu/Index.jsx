import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import TimeWrapper from "@components/splash-screen/TimeWrapper";
import NetworkStatus from "@components/splash-screen/NetworkStatus";
import MenuItems from "@components/menu/MenuItems";

import LOCAL_STORAGE from "@utils/localStorage";

import "@styles/components/menu.scss";

export default function Menu() {
  const configs = useSelector(selectConfigs);

  return (
    <div className="menu-wrapper">
      <div className="head-menu-wrapper">
        <TimeWrapper />
        <div className="logo">
          {configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET() ? (
            <img
              src={configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET()}
              alt="logo"
            />
          ) : null}
        </div>
        <NetworkStatus />
      </div>
      <MenuItems />
    </div>
  );
}
