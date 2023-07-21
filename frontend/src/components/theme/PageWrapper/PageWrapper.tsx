'use client'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'

function PageWrapper({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode
  className: string
}) {
  return (
    <FadeInOut
      className={cx('page-content relative overflow-auto', className)}
      {...rest}
    >
      {children}
    </FadeInOut>
  )
}

export default PageWrapper
