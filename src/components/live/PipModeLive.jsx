import { memo, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectConfigs } from "@app/configs/configsSlice";
import { useNavigate } from "react-router-dom";
import {
  selectChannels,
  selectAllChannels,
  setChannels,
  selectCurrentChannel,
  setSelectedCategory as setSelectedCategorySlice,
} from "@app/channels/channelsSlice";
import { getChannelCategories, getLiveFavorite } from "@server/requests";
import LOCAL_STORAGE from "@utils/localStorage";

import useKeydown from "@hooks/useKeydown";

import TimeWrapper from "@components/splash-screen/TimeWrapper.tsx";
import CategoriesWrapper from "./components/CategoriesWrapper";
import ChannelsWrapper from "./components/ChannelsWrapper";
import EpgListWrapper from "./components/EpgListWrapper";
import SearchHandler from "./components/SearchHandler";

import "./styles/PipModeLive.scss";
import Search from "../search/Search";
import { setCtrl, setLastActiveIndex } from "../../app/global";

export default memo(function PipModeLive({
  setUrl,
  setPipMode,
  pipMode,
  refUrlLive,
  url,
  setIsShowProtected,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const configs = useSelector(selectConfigs);
  const channelCategories = useSelector(selectChannels);
  const allChannels = useSelector(selectAllChannels);
  const currentChannel = useSelector(selectCurrentChannel);

  const refSetIndex = useRef(false);

  const [activeControl, setActiveControl] = useState("channel");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    return () => {
      refSetIndex.current = false;
    };
  }, []);

  useEffect(() => {
    if (allChannels.length) {
      getCategories();
    }
  }, [allChannels]);

  useEffect(() => {
    if (currentChannel) {
      const foundIndex = allChannels.findIndex(
        (item) => item.id === currentChannel.id
      );
      dispatch(setLastActiveIndex(foundIndex));
    }
  }, [currentChannel]);

  useEffect(() => {
    if (activeControl === "search") {
      dispatch(setCtrl("inp"));
    }
  }, [activeControl]);

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

  const sortCategories = async (categories) => {
    let obj_categories = {};

    obj_categories["All"] = {
      id: 101010101,
      name: "All",
      content: [...allChannels],
      total: allChannels.length,
    };

    const favs = [];

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

        if (allChannels[i].is_favorite) {
          if (!favs.some((fav) => fav.id === allChannels[i].id)) {
            favs.push(allChannels[i]);
          }
        }

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

    obj_categories["favorites"].content = favs;
    obj_categories["favorites"].total = favs.length;

    dispatch(setChannels({ ...obj_categories }));
  };

  useEffect(() => {
    dispatch(setSelectedCategorySlice(selectedCategory));
  }, [selectedCategory]);

  useKeydown({
    isActive: !showSearch,

    back: () => {
      if (pipMode) {
        navigate("/menu");
      } else {
        setPipMode(false);
        window.PLAYER.setPositionPlayer(1920, 1080, 0, 0);
      }
    },
    ok: () => {},
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
            onClick={
              activeControl === "search" ? () => setShowSearch(true) : null
            }
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
            refSetIndex={refSetIndex}
            setCategory={setSelectedCategory}
            setControl={setActiveControl}
            control={activeControl === "category" && !showSearch}
            category={selectedCategory}
          />
          <ChannelsWrapper
            refSetIndex={refSetIndex}
            setUrl={setUrl}
            setControl={setActiveControl}
            selectedCategory={selectedCategory}
            control={activeControl === "channel" && !showSearch}
            setPipMode={setPipMode}
            isPipMode={pipMode}
            setIsShowProtected={setIsShowProtected}
          />
          <EpgListWrapper
            url={url}
            setUrl={setUrl}
            setPipMode={setPipMode}
            setControl={setActiveControl}
            refUrlLive={refUrlLive}
            control={activeControl === "epg" && !showSearch}
          />
        </div>
      </div>
    </>
  );
});
