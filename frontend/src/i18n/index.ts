import type { Language } from '@ors/types/locales'

import { createInstance } from 'i18next'
import ICU from 'i18next-icu'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next/initReactI18next'

import { getLocale, getOptions } from './settings'

const initI18next = async (lng: Language, ns?: Array<string> | string) => {
  const i18nInstance = createInstance()
  await i18nInstance
    .use(ICU)
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./locales/${language}/${namespace}.json`),
      ),
    )
    .init(getOptions(lng, ns))
  return i18nInstance
}

export async function useTranslation(
  lng: Language,
  ns?: Array<string> | string,
  keyPrefix?: string,
) {
  const i18nextInstance = await initI18next(lng, ns)
  return {
    i18n: i18nextInstance,
    t: i18nextInstance.getFixedT(
      lng,
      Array.isArray(ns) ? ns[0] : ns,
      keyPrefix,
    ),
  }
}

export { getLocale }
