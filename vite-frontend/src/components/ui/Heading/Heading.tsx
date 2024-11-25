import { PropsWithChildren } from 'react'

import cx from 'classnames'

interface PageHeadingProps extends PropsWithChildren {
  className?: string
}

export function PageHeading(props: PageHeadingProps) {
  const { children, className } = props
  return (
    <h1
      className={cx(
        'm-0 text-[1.928rem] leading-[1.167] text-typography-primary',
        className,
      )}
    >
      {children}
    </h1>
  )
}
