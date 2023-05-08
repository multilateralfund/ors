import { Dropdown } from 'flowbite-react'
import { useTranslation, Trans } from 'react-i18next'

import { LANGUAGES, LanguagesKeys, objectKeys } from '@/utils/constants'

export const LangSwitcher = () => {
  const { i18n } = useTranslation()

  const currentLanguage =
    LANGUAGES[i18n.language as LanguagesKeys]?.nativeName || 'English'

  return (
    <Dropdown label={currentLanguage} inline>
      {objectKeys(LANGUAGES).map(lng => (
        <Dropdown.Item
          key={lng}
          onClick={() => {
            i18n.changeLanguage(lng)
          }}
        >
          {LANGUAGES[lng].nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}
