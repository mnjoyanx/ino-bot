import { memo } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";

function MainLayout({ children }) {
  return (
    <div className="parent_main">
      <Navbar />

      <div className="outlet_main">
        <Outlet />
      </div>
    </div>
  );
}

export default memo(MainLayout);
