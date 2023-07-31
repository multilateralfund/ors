'use client'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'

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
        'page-content relative p-4',
        { 'h-fit': !fill, 'h-full': !!fill },
        className,
      )}
      {...rest}
    >
      {children}
    </FadeInOut>
  )
}
