export type LanguagesKeys = 'en' | 'ar' | 'cn' | 'es' | 'fr' | 'ru'

export const LANGUAGES: { [key in LanguagesKeys]: { nativeName: string } } = {
  en: { nativeName: 'English' },
  ar: { nativeName: 'Arabic' },
  cn: { nativeName: 'Chinese' },
  es: { nativeName: 'Spain' },
  fr: { nativeName: 'Français' },
  ru: { nativeName: 'Russian' },
}
