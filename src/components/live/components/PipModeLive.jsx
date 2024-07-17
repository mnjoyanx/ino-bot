import { memo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import {
  selectChannels,
  selectAllChannels,
  setChannels,
} from "@app/channels/channelsSlice";
import { getChannelCategories } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

import TimeWrapper from "@components/splash-screen/TimeWrapper.jsx";
import CategoriesWrapper from "./CategoriesWrapper";
import ChannelsWrapper from "./ChannelsWrapper";
import EpgListWrapper from "./EpgListWrapper";

import "../styles/PipModeLive.scss";

export default memo(function PipModeLive() {
  const dispatch = useDispatch();

  const configs = useSelector(selectConfigs);
  const channelCategories = useSelector(selectChannels);
  const allChannels = useSelector(selectAllChannels);

  const [activeControl, setActiveControl] = useState("categorie"); // categorie, channel,epg
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  return (
    <div className="parent-pip_mode">
      <div className="head-pip_mode">
        <div className="search-handler"></div>
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
          control={activeControl === "categorie"}
        />
        <ChannelsWrapper
          selectedCategory={selectedCategory}
          control={activeControl === "channel"}
        />
        <EpgListWrapper />
      </div>
    </div>
  );
});
