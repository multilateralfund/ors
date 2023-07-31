import type { Language, Locales } from '@ors/types/locales'

const apiPath = process.env.NEXT_PUBLIC_API_PATH
const apiPrivatePath = process.env.NEXT_PRIVATE_API_PATH

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
    apiPrivatePath?: string
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
    apiPrivatePath,
  },
}

export default baseConfig
