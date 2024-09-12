import cx from 'classnames'

import { TableHeaderCellsProps } from './types'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'

export default function HeaderCells(props: TableHeaderCellsProps) {
  const {
    columns,
    enableSort,
    onSort,
    sortDirection,
    sortOn,
    sortableColumns,
  } = props
  const sortIcon =
    sortDirection > 0 ? (
      <IoChevronDown className="min-w-8 text-secondary" size={18} />
    ) : (
      <IoChevronUp className="min-w-8 text-secondary" size={18} />
    )

  const hCols = []

  for (let i = 0; i < columns.length; i++) {
    const isSortable = sortableColumns
      ? sortableColumns.includes(i)
      : enableSort

    hCols.push(
      <th
        key={i}
        className={cx('relative', columns[i].className, {
          'cursor-pointer': isSortable,
        })}
        onClick={() => {
          if (isSortable) {
            onSort(i)
          }
        }}
      >
        {columns[i].label}{' '}
        {sortOn === i ? (
          <div className="absolute bottom-1 right-1 print:hidden">
            {sortIcon}
          </div>
        ) : null}
      </th>,
    )
  }

  return hCols
}
