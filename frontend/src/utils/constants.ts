export const API_URL = import.meta.env.VITE_API_URL

export type LanguagesKeys = 'en' | 'ar' | 'cn' | 'es' | 'fr' | 'ru'

export const LANGUAGES: Record<LanguagesKeys, { nativeName: string }> = {
  en: { nativeName: 'English' },
  ar: { nativeName: 'Arabic' },
  cn: { nativeName: 'Chinese' },
  es: { nativeName: 'Spain' },
  fr: { nativeName: 'Français' },
  ru: { nativeName: 'Russian' },
}

export const objectKeys = <Obj>(obj: Obj): (keyof Obj)[] => {
  if (obj) {
    return Object.keys(obj) as (keyof Obj)[]
  }
  return []
}
