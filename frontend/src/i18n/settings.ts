import type { Language } from '@ors/types/locales'

import config from '@ors/config'

export const fallbackLng = config.i18n.defaultLanguage
export const languages = config.i18n.locales.map((locale) => locale.code)
export const defaultNS = 'common'

export function getOptions(
  lng: Language = fallbackLng,
  ns: Array<string> | string = defaultNS,
) {
  return {
    defaultNS,
    fallbackLng,
    fallbackNS: defaultNS,
    lng,
    ns,
    supportedLngs: languages,
  }
}

export function getLocale(lng: Language) {
  return config.i18n.locales.filter((locale) => locale.code === lng)[0]
}
