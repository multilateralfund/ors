import React from 'react'

import cx from 'classnames'

export default function DiffPill(props: any) {
  const { change_type } = props

  return (
    <div
      className={cx(
        'w-fit shrink-0 whitespace-nowrap rounded-md px-1 text-center text-sm uppercase',
        {
          'bg-gray-200 text-gray-700': change_type === 'deleted',
          'bg-green-200 text-green-700': change_type === 'new',
        },
      )}
    >
      {change_type === 'new' ? 'NEW' : 'DELETED'}
    </div>
  )
}
