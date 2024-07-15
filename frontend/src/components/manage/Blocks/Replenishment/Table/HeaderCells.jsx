import cx from 'classnames'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'

export default function HeaderCells(props) {
  const { columns, enableSort, onSort, sortDirection, sortOn } = props

  const sortIcon =
    sortDirection > 0 ? (
      <IoChevronDown className="min-w-8 text-secondary" size={18} />
    ) : (
      <IoChevronUp className="min-w-8 text-secondary" size={18} />
    )

  const hCols = []

  for (let i = 0; i < columns.length; i++) {
    hCols.push(
      <th
        key={i}
        className={cx('relative', { 'cursor-pointer': enableSort })}
        onClick={function () {
          enableSort && onSort(i)
        }}
      >
        {columns[i].label}{' '}
        {sortOn === i ? (
          <div className="absolute bottom-1 right-1">{sortIcon}</div>
        ) : null}
      </th>,
    )
  }

  return hCols
}
