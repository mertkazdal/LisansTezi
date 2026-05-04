import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./locales/tr";
import en from "./locales/en";

export const supportedLanguages = ["tr", "en"];

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

function getInitialLanguage() {
  if (typeof localStorage === "undefined") {
    return "tr";
  }

  const savedLanguage = localStorage.getItem("language");
  return supportedLanguages.includes(savedLanguage) ? savedLanguage : "tr";
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "tr",
  returnEmptyString: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
