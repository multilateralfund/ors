import cx from 'classnames'

import logoWhiteUrl from '/logos/logo_en_white.png?url'
import logoUrl from '/logos/logo_en.png?url'

export type LogoProps = {
  className?: string
  variant?: 'blue' | 'white'
}

export default function Logo({ className, variant }: LogoProps) {
  const src = variant === 'white' ? logoWhiteUrl : logoUrl
  return (
    <div className={cx('logo relative block items-center', className)}>
      <img
        id="logo"
        alt="Multilateral Fund"
        width="260"
        style={{ width: "260px"}}
        src={src}
      />
    </div>
  )
}
