'use client'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function PageWrapper({
  children,
  className,
  defaultSpacing = true,
  fill,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  defaultSpacing?: boolean
  fill?: boolean
}) {
  return (
    <FadeInOut
      className={cx(
        'page-content container relative',
        { 'h-fit': !fill, 'h-full': !!fill, 'mb-40 mt-12': defaultSpacing },
        className,
      )}
      {...rest}
    >
      {children}
    </FadeInOut>
  )
}
