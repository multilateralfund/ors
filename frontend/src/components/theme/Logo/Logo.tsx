'use client'

import cx from 'classnames'

import Image from '@ors/components/ui/Image/Image'

export type LogoProps = {
  className?: string
}

export default function Logo({ className }: LogoProps) {
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
        src="/assets/logos/logo_en.png"
      />
    </div>
  )
}
