'use client'

import { Dropdown } from '@ors/components'
import config from '@ors/registry'

import { getLocale, useTranslation } from '@ors/i18n/client'

const LanguageSelector = ({ className }: { className: string }) => {
  const { locales } = config.i18n
  const { changeLanguage, lang } = useTranslation()

  return (
    <Dropdown
      id="language-selector"
      className={className}
      label={getLocale(lang)?.nativeName}
    >
      {locales.map((locale) => (
        <Dropdown.Item
          key={locale.code}
          onClick={() => {
            changeLanguage(locale.code)
          }}
        >
          {locale.nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}

export default LanguageSelector
