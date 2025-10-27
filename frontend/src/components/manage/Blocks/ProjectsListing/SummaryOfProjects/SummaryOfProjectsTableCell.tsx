import IntrinsicElements = React.JSX.IntrinsicElements
import cx from 'classnames'
import React from 'react'

const SummaryOfProjectsTableCell = ({
  className,
  children,
}: IntrinsicElements['div']) => {
  return (
    <div
      className={cx(
        'table-cell border border-solid border-primary p-2 align-top',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default SummaryOfProjectsTableCell
