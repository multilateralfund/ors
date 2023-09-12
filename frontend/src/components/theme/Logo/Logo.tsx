'use client'

import cx from 'classnames'

import Image from '@ors/components/ui/Image/Image'

import { useTranslation } from '@ors/i18n/client'

export type LogoProps = {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  const { lang } = useTranslation()
  const logoUrl = `/assets/logos/logo_${lang}.png`

  return (
    <div
      className={cx(
        'logo relative block h-[100px] w-[240px] items-center',
        className,
      )}
    >
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
