'use client'
import Dropdown from '@ors/components/ui/Dropdown'
import { LANGUAGES } from '@ors/constants'

const LanguageSelector = ({ className }: { className: string }) => {
  return (
    <Dropdown className={className} label={'English'}>
      {Object.entries(LANGUAGES).map(([key, lang]) => (
        <Dropdown.Item key={key} onClick={() => {}}>
          {lang.nativeName}
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}

export default LanguageSelector
