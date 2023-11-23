import type { I18nSlice } from '@ors/types/store'

import { dir } from 'i18next'
import { produce } from 'immer'
import Cookies from 'js-cookie'

import config from '@ors/registry'
import { CreateSliceProps } from '@ors/store'

export const createI18nSlice = ({
  initialState,
  set,
}: CreateSliceProps): I18nSlice => {
  const lang = initialState?.i18n?.lang || config.i18n.defaultLanguage

  return {
    dir: dir(lang),
    lang,
    setLang: (lang) => {
      set(
        produce((state) => {
          // Set html attributes
          if (__CLIENT__) {
            document.documentElement.setAttribute('lang', lang)
            // Set dir only on ssr
            // document.documentElement.setAttribute('dir', newDir)
          }
          // Save language cookie
          Cookies.set(config.cookies.language, lang)
          state.i18n.lang = lang
          state.i18n.dir = dir(lang)
        }),
      )
    },
  }
}
