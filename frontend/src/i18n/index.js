// src/i18n/index.js — i18next setup
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ta from './ta.json';
import en from './en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ta: { translation: ta },
      en: { translation: en },
    },
    lng: localStorage.getItem('lang') || 'ta',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
