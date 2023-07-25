'use client'
import { Image } from '@ors/components'

import { useTranslation } from '@ors/i18n/client'

export default function Logo() {
  const { lang } = useTranslation()
  const logoUrl = `/assets/logos/logo_${lang}.png`

  return (
    <div className="logo relative mb-5 block w-60 items-center">
      <Image alt="Multilateral Fund" src={logoUrl} />
    </div>
  )
}
