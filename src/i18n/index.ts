import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

// Only Spanish and English content exists today — any other device language
// falls back to Spanish. Mirrors the same detection + fallback rule used by
// the category data registry, so both stay in sync.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const initialLanguage = deviceLanguage === "en" ? "en" : "es";

// Resources are bundled JSON (no network fetch, no async language detector),
// so init() completes synchronously — safe to import this module for its
// side effect alone from non-component code (the match store, character
// data) that needs translated strings before any component has rendered.
i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "es",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
