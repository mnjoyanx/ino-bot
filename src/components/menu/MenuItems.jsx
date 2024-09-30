import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useKeydown from "@hooks/useKeydown";
import PATHS from "@utils/paths";
import MenuItem from "./MenuItem";
import MainModal from "../modal/MainModal";
import AppExit from "../common/AppExit";

import SvgApps from "@assets/images/menu/SvgApps";
import SvgLive from "@assets/images/menu/SvgLive";
import SvgMovies from "@assets/images/menu/SvgMovies";
import SvgSettings from "@assets/images/menu/SvgSettings";
import bgApps from "@assets/images/menu/bg_apps.png";
import bgLive from "@assets/images/menu/bg_live.png";
import bgMovies from "@assets/images/menu/bg_movies.png";
import bgSettings from "@assets/images/menu/bg_settings.png";

import "./menuItems.scss";

export default function MenuItems() {
  const navigate = useNavigate();

  const list = [
    {
      id: 0,
      title: "Live Action",
      icon: <SvgLive />,
      bg_image: bgLive,
      path: PATHS.LIVE,
    },
    {
      id: 1,
      title: "Movies",
      icon: <SvgMovies />,
      bg_image: bgMovies,
      path: PATHS.MOVIES,
    },
    {
      id: 2,
      title: "Settings",
      icon: <SvgSettings />,
      bg_image: bgSettings,
      path: PATHS.SETTINGS,
    },
    {
      id: 3,
      title: "Apps",
      icon: <SvgApps />,
      bg_image: bgApps,
      path: PATHS.APPS,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [show, setShow] = useState(false);

  const listMenu = useMemo(() => list.map((item) => item), []);

  const onClick = useCallback((path) => {
    if (path != "/movies") {
      if (path == "/apps") {
        if (window.Android) {
          window.Android.launchApp("org.cyanogenmod.appdrawer");
        }
      } else {
        navigate(path);
      }
    }
  }, []);

  const onMouseEnter = useCallback((index) => setActiveIndex(index), []);

  useKeydown({
    isActive: !show,

    left: () => {
      if (activeIndex === 0 || activeIndex === 2) return;
      setActiveIndex(activeIndex - 1);
    },

    right: () => {
      if (activeIndex === 1 || activeIndex === 3) return;
      setActiveIndex(activeIndex + 1);
    },

    up: () => {
      if (activeIndex > 1) setActiveIndex(activeIndex - 2);
    },

    down: () => {
      if (activeIndex < 2) setActiveIndex(activeIndex + 2);
    },

    ok: () => {
      onClick(list[activeIndex].path);
    },

    back: () => {
      ///
      setShow(true);
    },
  });

  return (
    <div className="menu-list_wrapper">
      <MainModal show={show} setShow={setShow}>
        <AppExit
          onCancel={() => setShow(false)}
          onConfirm={() => {
            if (window.Android) {
              window.Android.exitApp();
            }
          }}
        />
      </MainModal>
      {listMenu.map((item, index) => {
        return (
          <MenuItem
            key={item.id}
            item={item}
            isActive={activeIndex === index}
            index={index}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
          />
        );
      })}
    </div>
  );
}
