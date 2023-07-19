'use client'
import Dropdown from '@ors/components/ui/Dropdown'
import { LANGUAGES, LanguagesKeys } from '@ors/constants'

const LanguageSelector = ({ className }: { className: string }) => {
  return (
    <Dropdown label={'English'} className={className}>
      {Object.entries(LANGUAGES).map(([key, lang]) => (
        <Dropdown.Item onClick={() => {}} key={key}>
          {lang.nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}

export default LanguageSelector
