import { memo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import { useNavigate } from "react-router-dom";
import {
  selectChannels,
  selectAllChannels,
  setChannels,
} from "@app/channels/channelsSlice";
import { getChannelCategories } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

import useKeydown from "@hooks/useKeydown";

import TimeWrapper from "@components/splash-screen/TimeWrapper.jsx";
import CategoriesWrapper from "./components/CategoriesWrapper";
import ChannelsWrapper from "./components/ChannelsWrapper";
import EpgListWrapper from "./components/EpgListWrapper";
import SearchHandler from "./components/SearchHandler";

import "./styles/PipModeLive.scss";
import Search from "../search/Search";

export default memo(function PipModeLive({ setUrl, setPipMode }) {
  const dispatch = useDispatch();

  const configs = useSelector(selectConfigs);
  const channelCategories = useSelector(selectChannels);
  const allChannels = useSelector(selectAllChannels);

  const navigate = useNavigate();

  const [activeControl, setActiveControl] = useState("category"); // category, channel,epg,search
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (allChannels.length) {
      getCategories();
    }
  }, [allChannels]);

  const getCategories = async () => {
    if (Object.keys(channelCategories).length <= 1) {
      const response = await getChannelCategories({
        query: JSON.stringify({ pagination: false }),
      });
      const parsedResponse = JSON.parse(response);
      const { error, message } = parsedResponse;
      if (error) {
        sortCategories([]);
      } else {
        sortCategories(message);
      }
    }
  };

  const sortCategories = (categories) => {
    let obj_categories = {};

    obj_categories["All"] = {
      id: 101010101,
      name: "All",
      content: [...allChannels],
      total: allChannels.length,
    };

    obj_categories["favorites"] = {
      id: 101010102,
      name: "favorites",
      content: [],
      total: 0,
    };

    categories.forEach((category) => {
      obj_categories[category.name] = {
        id: category.id,
        name: category.name,
        content: [],
        total: 0,
      };
      for (let i = 0; i < allChannels.length; i++) {
        let channel = allChannels[i].categories.find(
          (e) => e.id === category.id
        );

        if (channel) {
          obj_categories[category.name].content = [
            ...obj_categories[category.name].content,
            allChannels[i],
          ];
        }
      }
      if (!obj_categories[category.name].content.length) {
        delete obj_categories[category.name];
      } else {
        obj_categories[category.name].total =
          obj_categories[category.name].content.length;
      }
    });

    dispatch(setChannels({ ...obj_categories }));
  };

  useKeydown({
    isActive: !showSearch,

    back: () => navigate("/menu"),
  });

  return (
    <>
      {showSearch ? (
        <Search
          type={"live"}
          setUrl={setUrl}
          setShow={setShowSearch}
          setPipMode={setPipMode}
        />
      ) : null}
      <div className="parent-pip_mode">
        <div className="head-pip_mode">
          <SearchHandler
            isActive={activeControl === "search" && !showSearch}
            control={activeControl === "search" && !showSearch}
            setControl={setActiveControl}
            onClick={() => setShowSearch(true)}
          />

          <div className="logo">
            <img
              src={configs?.basics?.logo || LOCAL_STORAGE.LOGO.GET()}
              alt="logo"
            />
          </div>
          <TimeWrapper />
        </div>
        <div className="main-pip_mode">
          <CategoriesWrapper
            setCategory={setSelectedCategory}
            setControl={setActiveControl}
            control={activeControl === "category" && !showSearch}
          />
          <ChannelsWrapper
            setUrl={setUrl}
            setControl={setActiveControl}
            selectedCategory={selectedCategory}
            control={activeControl === "channel" && !showSearch}
            setPipMode={setPipMode}
          />
          <EpgListWrapper
            setControl={setActiveControl}
            control={activeControl === "epg" && !showSearch}
          />
        </div>
      </div>
    </>
  );
});
