'use client'
import Dropdown from '@ors/components/ui/Dropdown'
import { LANGUAGES, LanguagesKeys } from '@ors/constants'

const LanguageSelector = () => {
  return (
    <Dropdown label={'English'}>
      {Object.entries(LANGUAGES).map(([key, lang]) => (
        <Dropdown.Item onClick={() => {}} key={key}>
          {lang.nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}

export default LanguageSelector
