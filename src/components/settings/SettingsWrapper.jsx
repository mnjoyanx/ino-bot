import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PATHS from "@utils/paths.js";

import useKeydown from "@hooks/useKeydown";

import Item from "./components/ItemSettings";

import SAccount from "./components/SAccount";
import SNetwork from "./components/SNetwork";
import SLanguage from "./components/SLanguage";
import SDisplay from "./components/SDisplay";
import SAppInfo from "./components/SAppInfo";

import "./styles/SettingsWrapper.scss";

export default function SettingsWrapper({ children }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const list = [
    { id: 0, title: "Account", component: <SAccount /> },
    { id: 1, title: "Network", component: <SNetwork /> },
    { id: 2, title: "Language", component: <SLanguage /> },
    { id: 4, title: "Display", component: <SDisplay /> },
    { id: 5, title: "App Info", component: <SAppInfo /> },
  ];

  useKeydown({
    isActive: true,

    back: () => {
      navigate(PATHS.MENU);
    },

    up: () => {
      if (active === 0) return;

      setActive(active - 1);
    },

    down: () => {
      if (active === list.length - 1) return;

      setActive(active + 1);
    },
  });

  const onMouseEnter = useCallback((index) => setActive(index), []);

  return (
    <div className="settings-wrapper">
      <div className="list-settings">
        {list.map((item, index) => {
          return (
            <Item
              key={item.id}
              index={index}
              title={item.title}
              isActive={index === active}
              onMouseEnter={onMouseEnter}
            />
          );
        })}
      </div>
      <div className="parent-info-settings">{list[active].component}</div>
    </div>
  );
}
