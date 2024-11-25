'use client'

import cx from 'classnames'

import Image from '@ors/components/ui/Image/Image'

export type LogoProps = {
  className?: string
  variant?: 'blue' | 'white'
}

export default function Logo({ className, variant }: LogoProps) {
  const src =
    variant === 'white'
      ? '/assets/logos/logo_en_white.png'
      : '/assets/logos/logo_en.png'
  return (
    <div className={cx('logo relative block items-center', className)}>
      <Image
        id="logo"
        alt="Multilateral Fund"
        priority={true}
        sizes="260px"
        src={src}
      />
    </div>
  )
}
