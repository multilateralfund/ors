import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend, { HttpBackendOptions } from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    fallbackLng: 'en',
    lng: localStorage.getItem('lang') || 'en',
    debug: true,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

export default i18n
