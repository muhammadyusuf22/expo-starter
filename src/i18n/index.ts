import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import id from "./locales/id.json";

const resources = {
  en: { translation: en },
  id: { translation: id },
};

const LANGUAGE_KEY = "user-language";

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLanguage) {
    const deviceLanguage = getLocales()[0]?.languageCode;
    savedLanguage = deviceLanguage === "id" ? "id" : "en";
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3", // For Android compatibility
  } as any); // Cast to any to avoid compatibilityJSON TS error
};

export const changeLanguage = async (lang: "en" | "id") => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

initI18n();

export default i18n;
