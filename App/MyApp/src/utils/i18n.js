/**
 * i18n Configuration
 * Multilingual support for 10 languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translation files
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import as from '../i18n/as.json';
import bn from '../i18n/bn.json';
import brx from '../i18n/brx.json';
import grt from '../i18n/grt.json';
import kha from '../i18n/kha.json';
import mizo from '../i18n/mizo.json';
import mni from '../i18n/mni.json';
import ne from '../i18n/ne.json';

const LANGUAGE_KEY = 'app_language';

// Language detector
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        callback('en'); // Default to English
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      as: { translation: as },
      bn: { translation: bn },
      brx: { translation: brx },
      grt: { translation: grt },
      kha: { translation: kha },
      mizo: { translation: mizo },
      mni: { translation: mni },
      ne: { translation: ne },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper functions for backward compatibility
export const setLanguage = async (langTag) => {
  await i18n.changeLanguage(langTag);
};

export const getLanguage = () => {
  return i18n.language;
};

export const t = (key, options) => {
  return i18n.t(key, options);
};

export const onLanguageChange = (listener) => {
  i18n.on('languageChanged', listener);
  return () => i18n.off('languageChanged', listener);
};
