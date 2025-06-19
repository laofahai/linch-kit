import en from '../locales/en';
import zh from '../locales/zh';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  zh: { translation: zh },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

