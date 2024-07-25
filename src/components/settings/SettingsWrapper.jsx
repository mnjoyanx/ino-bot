import { memo, useState } from "react";
import Item from "./components/ItemSettings";

import useKeydown from "@hooks/useKeydown";

import "./styles/SettingsWrapper.scss";

export default function SettingsWrapper({ children }) {
  const [active, setActive] = useState(0);

  const list = [
    { id: 0, title: "Account", component: "" },
    { id: 1, title: "Network", component: "" },
    { id: 2, title: "Language", component: "" },
    { id: 4, title: "Display", component: "" },
    { id: 5, title: "App Info", component: "" },
  ];

  useKeydown({
    isActive: true,

    up: () => {
      if (active === 0) return;

      setActive(active - 1);
    },

    down: () => {
      if (active === list.length - 1) return;

      setActive(active + 1);
    },
  });

  return (
    <div className="settings-wrapper">
      <div className="list-settings">
        {list.map((item, index) => {
          return (
            <Item
              key={item.id}
              title={item.title}
              isActive={index === active}
            />
          );
        })}
      </div>
      <div className="info-settings"></div>
    </div>
  );
}
