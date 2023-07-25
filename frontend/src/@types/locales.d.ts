import type { TFunction, i18n as i18nOrg } from 'i18next'
import type { ReportNamespaces } from 'react-i18next'

export type Language = 'ar' | 'cn' | 'en' | 'es' | 'fr' | 'ru'

export type Locale = { code: Language; nativeName: string }

export type Locales = Array<Locale>

export interface i18n extends i18nOrg {
  language: Language
  reportNamespaces: ReportNamespaces
}

export type UseTranslationResponse<Ns extends Namespace, KPrefix> = [
  t: TFunction<Ns, KPrefix>,
  i18n: i18n,
  ready: boolean,
] & {
  changeLanguage: (lang: Language) => void
  i18n: i18n
  lang: Language
  locale: Locale
  ready: boolean
  t: TFunction<Ns, KPrefix>
}
