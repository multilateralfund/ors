import styles from './table.module.css'

import { IoPencil, IoTrash } from 'react-icons/io5'

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
  const { columns, enableEdit, onDelete, onEdit, rowData } = props

  const hCols = []
  for (let i = 0; i < columns.length; i++) {
    hCols.push(<th key={i}>{columns[i].label}</th>)
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

  return (
    <table className={styles.replTable}>
      <thead>
        <tr>{hCols}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

export default Table
