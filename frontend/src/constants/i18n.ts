export type LanguagesKeys = 'ar' | 'cn' | 'en' | 'es' | 'fr' | 'ru'

export type Languages = { [key in LanguagesKeys]: { nativeName: string } }

export const LANGUAGES = {
  ar: { nativeName: 'Arabic' },
  cn: { nativeName: 'Chinese' },
  en: { nativeName: 'English' },
  es: { nativeName: 'Spain' },
  fr: { nativeName: 'Français' },
  ru: { nativeName: 'Russian' },
}
