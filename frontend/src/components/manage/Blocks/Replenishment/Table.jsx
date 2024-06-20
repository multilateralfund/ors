import cx from 'classnames'

import styles from './table.module.css'

import { IoChevronDown, IoChevronUp, IoPencil, IoTrash } from 'react-icons/io5'

function AdminButtons(props) {
  const { onDelete, onEdit } = props
  return (
    <div className={styles.adminButtons}>
      <button
        className="cursor-pointer rounded-lg border border-solid border-secondary bg-white text-secondary hover:bg-secondary hover:text-white"
        title="Edit"
        onClick={onEdit}
      >
        <IoPencil />
      </button>
      <button
        className="cursor-pointer rounded-lg border border-solid border-error bg-white text-error hover:bg-error hover:text-white"
        title="Delete"
        onClick={onDelete}
      >
        <IoTrash />
      </button>
    </div>
  )
}

function Table(props) {
  const {
    columns,
    enableEdit,
    enableSort,
    onDelete,
    onEdit,
    onSort,
    rowData,
    sortDirection,
    sortOn,
  } = props

  const sortIcon =
    sortDirection > 0 ? (
      <IoChevronDown className="min-w-8 text-secondary" size={18} />
    ) : (
      <IoChevronUp className="min-w-8 text-secondary" size={18} />
    )

  const hCols = []
  for (let i = 0; i < columns.length; i++) {
    hCols.push(
      <th key={i} className="relative" onClick={() => enableSort && onSort(i)}>
        {columns[i].label}{' '}
        {sortOn === i ? (
          <div className="absolute bottom-1 right-1">{sortIcon}</div>
        ) : null}
      </th>,
    )
  }

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < columns.length; i++) {
      row.push(
        <td key={i}>
          <div className="flex items-center justify-between">
            <span className="mr-4 whitespace-nowrap">
              {rowData[j][columns[i].field]}
            </span>
            {!i && enableEdit ? (
              <AdminButtons
                onDelete={() => onDelete(j)}
                onEdit={() => onEdit(j)}
              />
            ) : null}
          </div>
        </td>,
      )
    }
    rows.push(<tr key={j}>{row}</tr>)
  }

  if (rows.length === 0) {
    rows.push(
      <tr key="empty">
        <td className="text-center" colSpan={hCols.length}>
          Empty
        </td>
      </tr>,
    )
  }

  return (
    <table className={cx(styles.replTable, props.className)}>
      <thead>
        <tr>{hCols}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

export default Table
