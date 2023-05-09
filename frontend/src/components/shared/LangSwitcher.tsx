import { useSelector, useDispatch } from 'react-redux'
import { Dropdown } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { selectLang, setLang } from '@/slices/userSlice'

import { LANGUAGES, LanguagesKeys, objectKeys } from '@/utils/constants'

export const LangSwitcher = () => {
  const dispatch = useDispatch()
  const { i18n } = useTranslation()
  const lang = useSelector(selectLang)

  const currentLanguage =
    LANGUAGES[lang as LanguagesKeys]?.nativeName || 'English'

  const handleChangeLanguage = (lang: LanguagesKeys) => {
    i18n.changeLanguage(lang)
    dispatch(setLang({ lang }))
  }

  return (
    <Dropdown label={currentLanguage} inline>
      {objectKeys(LANGUAGES).map(lng => (
        <Dropdown.Item key={lng} onClick={() => handleChangeLanguage(lng)}>
          {LANGUAGES[lng].nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}
