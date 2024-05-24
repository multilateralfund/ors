import React from 'react'

import cx from 'classnames'

type ChangeType = 'changed' | 'deleted' | 'new'

interface DiffPillProps {
  change_type: ChangeType
}

export default function DiffPill(props: DiffPillProps) {
  const { change_type } = props
  const type = { changed: 'CHANGED', deleted: 'DELETED', new: 'NEW' }

  if (change_type === 'changed') return null

  return (
    <div
      className={cx('w-fit rounded-md px-1 text-center text-sm uppercase', {
        'bg-gray-200 text-gray-700': change_type === 'deleted',
        'bg-mlfs-purple text-white': change_type === 'new',
      })}
    >
      {type[change_type]}
    </div>
  )
}
