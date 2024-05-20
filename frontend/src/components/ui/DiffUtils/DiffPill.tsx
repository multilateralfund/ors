import React from 'react'

import cx from 'classnames'

export default function DiffPill(props: any) {
  const { type = 'new' } = props

  return (
    <div
      className={cx('shrink-0 px-1 text-sm uppercase text-center w-fit rounded-md whitespace-nowrap', {
        'bg-gray-200 text-gray-700': type === 'deleted',
        'bg-green-200 text-green-700': type === 'new',
      })}
    >
      {type === "new" ? "NEW" : "DELETED"}
    </div>
  )
}
