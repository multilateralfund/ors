import React from 'react'

import cx from 'classnames'

interface CPSectionWrapperProps {
  children?: React.ReactNode
  className?: string
}

export default function CPSectionWrapper({
  children = [],
  className = '',
}: CPSectionWrapperProps) {
  return (
    <div
      className={cx(
        'relative rounded-b-lg rounded-r-lg border border-solid border-primary bg-white p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
