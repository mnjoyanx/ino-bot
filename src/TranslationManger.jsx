import React, { useState, useEffect } from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

// Custom backend for API-based translations
const apiTranslationBackend = {
  type: "backend",
  init: function () {
    // Initialization method (if needed)
  },
  read: async function (language, namespace, callback) {
    console.log(language, "---", namespace, callback, "callbackkkk");
    try {
      // Replace with your actual API endpoint
      const response = await fetch(
        `https://api.tctv.ge/application/translations?id=13`,
        // https://api.inorain.tv/application/translations?id={language_id}
      );

      console.log("------", response);

      if (!response.ok) {
        console.log(response, "resss");
        return callback(new Error("Failed to fetch translations"), null);
      }

      const translations = await response.json();
      conosle.log(translations, "traaanan");
      callback(null, translations);
    } catch (error) {
      callback(error, null);
    }
  },
};

const transformTranslations = (apiData) => {
  // Example transformation logic
  const transformedTranslations = {};

  // Flatten nested objects
  const flattenObject = (obj, prefix = "") => {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? prefix + "." : "";
      if (typeof obj[key] === "object" && obj[key] !== null) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  };

  // Transform your specific API structure
  transformedTranslations = flattenObject(apiData);

  return transformedTranslations;
};

// Configure i18next with API backend
i18n
  .use(initReactI18next)
  .use({
    type: "backend",
    read: apiTranslationBackend.read,
  })
  .init({
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      escapeValue: false, // React already escapes
    },
    backend: {
      // Optional configuration for your API backend
      customHandler: apiTranslationBackend.read,
    },
    resources: {
      en: {
        // You can manually transform and add translations
        translation: apiTranslationBackend.read,
      },
    },
  });

// Component to handle language switching and translations
const TranslationManager = () => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to change language and fetch translations
  const changeLanguage = async (lng) => {
    setIsLoading(true);
    setError(null);

    try {
      await i18n.changeLanguage(lng);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading translations...</div>}
      {error && <div>Error loading translations: {error.message}</div>}

      {/* <div>
        <h1>{t("welcome")}</h1>
        <button onClick={() => changeLanguage("en")}>English</button>
        <button onClick={() => changeLanguage("es")}>Español</button>
      </div> */}
    </div>
  );
};

export default TranslationManager;
