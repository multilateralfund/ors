import type { Language } from '@ors/types/locales'

import { dir } from 'i18next'
import Cookies from 'js-cookie'
import { StoreApi } from 'zustand'

import config from '@ors/registry'
import { InitialStoreState, StoreState } from '@ors/store'

export interface I18nSlice {
  dir: 'ltr' | 'rtl'
  lang: Language
  setLang?: (lang: Language) => void
}

export const createI18nSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): I18nSlice => {
  const lang = initialState?.i18n?.lang || config.i18n.defaultLanguage

  return {
    dir: dir(lang),
    lang,
    setLang: (lang) => {
      set((state) => {
        // Get new direction
        const newDir = dir(lang)
        // Set html attributes
        if (__CLIENT__) {
          document.documentElement.setAttribute('lang', lang)
          // Set dir only on ssr
          // document.documentElement.setAttribute('dir', newDir)
        }
        // Save language cookie
        Cookies.set(config.cookies.language, lang)
        return { i18n: { ...state.i18n, dir: newDir, lang } }
      })
    },
  }
}
