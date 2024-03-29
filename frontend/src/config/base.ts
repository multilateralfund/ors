import type { Language, Locales } from '@ors/types/locales'

const apiPath = process.env.NEXT_PUBLIC_API_PATH
const host = process.env.NEXT_PUBLIC_HOST
const protocol = process.env.NEXT_PUBLIC_PROTOCOL

export type BaseConfig = {
  cookies: {
    language: string
    theme: string
  }
  defaultTheme: 'dark' | 'light'
  i18n: {
    defaultLanguage: Language
    defaultNamespace: string
    locales: Locales
  }
  settings: {
    apiPath?: string
    host?: string
    protocol?: string
  }
}

const baseConfig: BaseConfig = {
  cookies: {
    language: process.env.NEXT_PUBLIC_COOKIE_LANGUAGE || 'i18next',
    theme: process.env.NEXT_PUBLIC_COOKIE_theme || 'theme',
  },
  defaultTheme: 'light',
  i18n: {
    defaultLanguage: 'en',
    defaultNamespace: 'common',
    locales: [
      { code: 'ar', nativeName: 'العربية' },
      { code: 'cn', nativeName: '中文' },
      { code: 'en', nativeName: 'English' },
      { code: 'es', nativeName: 'Español' },
      { code: 'fr', nativeName: 'Français' },
      { code: 'ru', nativeName: 'Русский' },
    ],
  },
  settings: {
    apiPath,
    host,
    protocol,
  },
}

export default baseConfig
