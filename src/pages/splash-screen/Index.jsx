import { useEffect, useState, useRef, memo } from "react";
import { useDispatch } from "react-redux";

import { useNavigate } from "react-router-dom";

import { getLanguages, getAppSettings } from "@server/requests.js";

import os from "@utils/os.js";
import storage from "@utils/localStorage.js";
import PATHS from "@utils/paths.js";
import { generateMacAddress } from "@utils/util.js";

import Loading from "@components/common/Loading.jsx";
import TimeWrapper from "@components/splash-screen/TimeWrapper.tsx";

// import { setTranslations } from "../../app/translations/translationsSlice.js";
import { setConfigs } from "@app/configs/configsSlice.js";
import LOCAL_STORAGE from "@utils/localStorage.js";
import "@styles/global.css";
import "@styles/components/splash-screen.scss";
import NetworkStatus from "@components/splash-screen/NetworkStatus.jsx";

function SplashScreen() {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const languageRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [imagesApp, setImagesApp] = useState({});

  const getLanguage = async () => {
    if (localStorage.getItem("language")) {
      languageRef.current = storage.LANGUAGE.GET();

      getConfigs();
    } else {
      const languages = await getLanguages();
      const parsedLanguages = JSON.parse(languages);
      const { message } = parsedLanguages;

      const defaultLanguage = message.find((item) => item.default === true);

      languageRef.current = defaultLanguage;
      storage.LANGUAGE.SET(defaultLanguage);

      getConfigs();
    }
  };

  const getConfigs = async () => {
    const configs = await getAppSettings({
      languageId: languageRef.current.id,
    });
    const parsedConfigs = JSON.parse(configs);
    const { message } = parsedConfigs;

    message.basics = message.basics[0];

    console.log(message, "messsage");

    LOCAL_STORAGE.LOGO.SET(message.basics.logo);

    setImagesApp((prev) => {
      return {
        ...prev,
        bg: message.basics.background_image,
        logo: message.basics.logo,
        host: message.app_settings.web_host,
      };
    });

    console.log(message, "message");

    dispatch(setConfigs(message));

    setIsLoading(false);
    checkDeviceId();
    // get_configs({ languageId: languageRef.current.id }, (res) => {
    //   res.basics = res.basics[0];

    //   setImagesApp((prev) => {
    //     return {
    //       ...prev,
    //       bg: res.basics.background_image,
    //       logo: res.basics.logo,
    //       host: res.app_settings.web_host,
    //     };
    //   });

    //   // dispatch(setConfigs({}));

    //   // getTranslatedWords(!res.app_settings.is_authorization_enabled);
    // });
  };

  const getTranslatedWords = (is_guest) => {
    translated_words({ id: languageRef.current.id }, (res) => {
      const translatedWords = res.reduce((acc, item) => {
        acc[item.key.toLowerCase()] = item.translatedWord;

        return acc;
      }, {});

      dispatch(setTranslations(translatedWords));

      // if guest mode is enabled, navigate to login page

      let token = LOCAL_STORAGE.TOKEN.GET();

      if (token) {
        validate_token(
          {},
          (res) => {
            if (res.is_guest) navigate(PATHS.MENU);
            else navigate(PATHS.SUBUSERS);
          },
          (err) => {
            localStorage.removeItem("TOKEN");
            callbackRoutePage(is_guest);
          },
        );
      } else {
        callbackRoutePage(is_guest);
      }
    });
  };

  const callbackRoutePage = (is_guest) => {
    if (!is_guest) navigate(PATHS.LOGIN);
    else navigate(PATHS.MENU);
  };

  const checkDeviceId = () => {
    if (LOCAL_STORAGE.DEVICE_ID.GET()) {
      LOCAL_STORAGE.MAC_ADDRESS.SET(
        generateMacAddress(LOCAL_STORAGE.DEVICE_ID.GET()),
      );
    }
    setTimeout(() => {
      navigate(PATHS.ACTIVATION_PAGE);
    }, 3000);
  };

  useEffect(() => {
    os(getLanguage);
  }, []);

  return isLoading ? (
    <div className="loading-parent">
      <Loading />
    </div>
  ) : (
    <div className={"splash-screen-container"}>
      <div className="head-splashscreen">
        <TimeWrapper />
        <NetworkStatus />
      </div>
      <div className="logo-splashscreen">
        <img src={imagesApp?.logo} alt="logo" />
      </div>
    </div>
  );
}

export default memo(SplashScreen);
