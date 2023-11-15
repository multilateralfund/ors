'use client'
import { CSSProperties } from 'react'

import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function PageWrapper({
  children,
  className,
  defaultSpacing = true,
  fill,
  style,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  defaultSpacing?: boolean
  fill?: boolean
  style?: CSSProperties
}) {
  return (
    <FadeInOut
      className={cx(
        'page-content container relative',
        { 'h-fit': !fill, 'h-full': !!fill, 'mb-8 mt-8': defaultSpacing },
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </FadeInOut>
  )
}
