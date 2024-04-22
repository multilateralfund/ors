'use client'

import type { Language, UseTranslationResponse } from '@ors/types/locales'
import type { FlatNamespace } from 'i18next'
import type { FallbackNs, UseTranslationOptions } from 'react-i18next'

import { useCallback, useMemo } from 'react'
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from 'react-i18next'

import i18next from 'i18next'
import ICU from 'i18next-icu'
import resourcesToBackend from 'i18next-resources-to-backend'

import { store } from '@ors/_store'
import { useStore } from '@ors/store'

import { getLocale, getOptions, languages } from './settings'

type $Tuple<T> = readonly [T?, ...T[]]

i18next
  .use(ICU)
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    ...getOptions(),
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    lng: store?.current.getState().i18n.lang,
    preload: __SERVER__ ? languages : [],
  })

export function useTranslation(
  ns?: Array<string> | string,
  options?: UseTranslationOptions<string>,
) {
  const { lang, setLang } = useStore((state) => ({
    lang: state.i18n.lang,
    setLang: state.i18n.setLang,
  }))
  const ret = useTranslationOrg(ns, { lng: lang, ...options })
  const { i18n } = ret

  if (lang !== i18n.language) {
    i18n.changeLanguage(lang)
  }

  const locale = useMemo(() => {
    return getLocale(lang)
  }, [lang])

  const changeLanguage = useCallback(
    (lang: Language) => {
      setLang(lang)
      i18n.changeLanguage(lang)
    },
    [setLang, i18n],
  )

  return { changeLanguage, lang, locale, ...ret } as UseTranslationResponse<
    FallbackNs<$Tuple<FlatNamespace> | FlatNamespace | undefined>,
    string
  >
}

export { getLocale }
