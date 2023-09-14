'use client'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function PageWrapper({
  children,
  className,
  fill,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  fill?: boolean
}) {
  return (
    <FadeInOut
      className={cx(
        'page-content container relative p-4',
        { 'h-fit': !fill, 'h-full': !!fill },
        className,
      )}
      {...rest}
    >
      {children}
    </FadeInOut>
  )
}
