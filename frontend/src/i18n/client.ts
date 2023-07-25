'use client'

import type { Language, UseTranslationResponse } from '@ors/types/locales'
import type { FlatNamespace } from 'i18next'
import type { FallbackNs, UseTranslationOptions } from 'react-i18next'
import type { $Tuple } from 'react-i18next/helpers'

import { useCallback, useEffect, useMemo } from 'react'
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from 'react-i18next'

import i18next from 'i18next'
import ICU from 'i18next-icu'
import resourcesToBackend from 'i18next-resources-to-backend'

import useStore, { getStore } from '@ors/store'

import { getLocale, getOptions, languages } from './settings'

const store = __SERVER__ ? getStore() : null

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
    lng: store ? store.getState().i18n.lang : undefined,
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
  const ret = useTranslationOrg(ns, options)
  const { i18n } = ret

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

  useEffect(() => {
    // Make sure i18n language is always equal to store language
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  return { changeLanguage, lang, locale, ...ret } as UseTranslationResponse<
    FallbackNs<$Tuple<FlatNamespace> | FlatNamespace | undefined>,
    string
  >
}

export { getLocale }
