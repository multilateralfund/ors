'use client'

import Image from '@ors/components/ui/Image'

import { useTranslation } from '@ors/i18n/client'

export default function Logo() {
  const { lang } = useTranslation()
  const logoUrl = `/assets/logos/logo_${lang}.png`

  return (
    <div className="logo relative mb-5 block h-[100px] w-[240px] items-center">
      <Image
        id="logo"
        alt="Multilateral Fund"
        priority={true}
        sizes="240px"
        src={logoUrl}
      />
    </div>
  )
}
