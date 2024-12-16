// TranslationProvider.js
import React, { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

const TranslationProvider = ({ children, langId }) => {
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(
          `https://api.tctv.ge/application/translations?id=${langId}`,
        );
        const data = await response.json();

        const transformedTranslations = data.message.reduce((acc, item) => {
          if (!acc[item.key]) {
            acc[item.key] = item.translatedWord;
          }
          return acc;
        }, {});
        const translations = {
          en: transformedTranslations,
        };

        setTranslations(translations);
        i18n.addResourceBundle("en", "translation", translations.en);
      } catch (error) {
        console.error("Error fetching translations:", error);
      }
    };

    fetchTranslations();
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default TranslationProvider;
