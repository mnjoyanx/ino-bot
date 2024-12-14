import { Provider } from "react-redux";

import { createRoot } from "react-dom/client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import App from "./App.jsx";
import store from "./app/store.js";

import "./styles/index.css";

import "./styles/global.css";
import "./styles/variables.css";
import "./styles/variables.scss";
import "./styles/mixins.scss";
import "@ino-ui/tv/index.css";

import { HashRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>,
);
