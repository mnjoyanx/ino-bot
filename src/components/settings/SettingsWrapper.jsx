import { memo, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsLangActive, setIsLangActive } from "@app/global";
import PATHS from "@utils/paths.js";
import { useTranslation } from "react-i18next";

import useKeydown from "@hooks/useKeydown";
import { selectAllSettings, setAllSettings } from "@app/configs/configsSlice";

import Item from "./components/ItemSettings";

import SAccount from "./components/SAccount";
import SNetwork from "./components/SNetwork";
import SLanguage from "./components/SLanguage";
import SAppInfo from "./components/SAppInfo";

import "./styles/SettingsWrapper.scss";
import { changeLang, getAppSettings, getLanguages } from "@server/requests";
import Loading from "@components/common/Loading";
import { InoButton } from "@ino-ui/tv";

export default function SettingsWrapper({ children }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const appData = useSelector(selectAllSettings);

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [ctrl, setCtrl] = useState("items");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [list, setList] = useState([]);

  const isLangActive = useSelector(selectIsLangActive);

  useKeydown({
    isActive: ctrl === "items" && !isLangActive,

    back: () => {
      navigate(PATHS.MENU);
    },

    up: () => {
      if (active === 0) return;

      setActive(active - 1);
    },

    right: () => {
      if (active === 2) {
        setCtrl("lang");
        dispatch(setIsLangActive(true));
      }
    },

    ok: () => {
      if (active === 1) {
        console.log("ok");
      }
    },

    down: () => {
      if (active === list.length - 1) {
        setCtrl("reload");
        return;
      }

      setActive(active + 1);
    },
  });

  const getConfigs = async (lang) => {
    setIsLoading(true);
    try {
      // const lang = JSON.parse(localStorage.getItem("language"));
      const langId = lang.id;
      const configs = await getAppSettings({
        languageId: langId,
      });
      const parsedConfigs = JSON.parse(configs);
      const { message } = parsedConfigs;

      dispatch(setAllSettings(message));
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguagesHandler = async () => {
    try {
      const lngs = await getLanguages();
      const parsedLanguages = JSON.parse(lngs);
      const { message } = parsedLanguages;

      setLanguages(message);

      // const defaultLanguage = message.find((item) => item.default === true);
      const defaultLanguageId = JSON.parse(localStorage.getItem("userLangId"));
      console.log(defaultLanguageId, "defaultLanguageId", message);
      const defaultLanguage = message.find(
        (item) => +item.id === +defaultLanguageId
      );
      console.log(defaultLanguage, "defaultLanguage");
      setSelectedLanguage(defaultLanguage);
    } catch (err) {
      console.log(err);
    }
  };

  const changeLanguageHandler = async (lang) => {
    try {
      const langId = lang.id;
      const configs = await changeLang({
        languageId: langId,
      });
      const parsedConfigs = JSON.parse(configs);
      const { message } = parsedConfigs;

      dispatch(setAllSettings(message));
      localStorage.setItem("userLangId", JSON.stringify(langId));
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    getLanguagesHandler();
  }, []);

  useEffect(() => {
    if (!isLangActive) {
      setCtrl("items");
    }
  }, [isLangActive]);

  useEffect(() => {
    console.log(appData, "appData", selectedLanguage);
    if (!selectedLanguage) return;

    if (!appData) {
      getConfigs(selectedLanguage);
    } else {
      setList([
        {
          id: 0,
          title: t("Account"),
          component: <SAccount data={appData.basics?.[0]} />,
        },
        { id: 1, title: t("Network"), component: <SNetwork /> },
        {
          id: 2,
          title: t("Language"),
          component: (
            <SLanguage
              languages={languages}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              changeLanguage={changeLanguageHandler}
            />
          ),
        },
        {
          id: 4,
          title: t("App Info"),
          component: (
            <SAppInfo
              description={appData.basics?.[0]?.description}
              companyName={appData.basics?.[0]?.company_name}
            />
          ),
        },
      ]);
    }
  }, [appData, selectedLanguage]);

  const onMouseEnter = useCallback((index) => setActive(index), []);

  return (
    <>
      {isLoading || !list.length ? (
        <div className="settings-loader">
          <Loading />
        </div>
      ) : (
        <>
          <div className="settings-wrapper">
            <>
              <div className="list-settings">
                {list.map((item, index) => {
                  return (
                    <Item
                      key={item.id}
                      index={index}
                      title={item.title}
                      isActive={index === active && ctrl === "items"}
                      onMouseEnter={onMouseEnter}
                    />
                  );
                })}
              </div>
              <div className="parent-info-settings">
                {list[active].component}
              </div>
            </>
          </div>

          <InoButton
            isActive={ctrl === "reload"}
            onUp={() => setCtrl("items")}
            onClick={() => {
              window.location = "/menu";
            }}
            onBack={() => navigate("/menu")}
            size="large"
            classNames="reload-btn"
            variant="outline"
          >
            <svg
              fill="#fff"
              viewBox="0 0 24 24"
              width={24}
              height={24}
              className="reload-btn_icon"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M1,12A11,11,0,0,1,17.882,2.7l1.411-1.41A1,1,0,0,1,21,2V6a1,1,0,0,1-1,1H16a1,1,0,0,1-.707-1.707l1.128-1.128A8.994,8.994,0,0,0,3,12a1,1,0,0,1-2,0Zm21-1a1,1,0,0,0-1,1,9.01,9.01,0,0,1-9,9,8.9,8.9,0,0,1-4.42-1.166l1.127-1.127A1,1,0,0,0,8,17H4a1,1,0,0,0-1,1v4a1,1,0,0,0,.617.924A.987.987,0,0,0,4,23a1,1,0,0,0,.707-.293L6.118,21.3A10.891,10.891,0,0,0,12,23,11.013,11.013,0,0,0,23,12,1,1,0,0,0,22,11Z"></path>
              </g>
            </svg>
            {t("Reload")}
          </InoButton>
        </>
      )}
    </>
  );
}
