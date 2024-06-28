import cx from 'classnames'

import HeaderCells from './HeaderCells'
import styles from './table.module.css'

import { IoPencil, IoTrash } from 'react-icons/io5'

function AdminButtons(props) {
  const { onDelete, onEdit } = props
  return (
    <div className={styles.adminButtons}>
      <button
        className="cursor-pointer rounded-lg border border-solid border-error bg-white text-error hover:bg-error hover:text-white"
        title="Delete"
        onClick={onDelete}
      >
        <IoTrash />
      </button>
      <button
        className="cursor-pointer rounded-lg border border-solid border-secondary bg-white text-secondary hover:bg-secondary hover:text-white"
        title="Edit"
        onClick={onEdit}
      >
        <IoPencil />
      </button>
    </div>
  )
}

function TableCell(props) {
  const {
    adminButtons = true,
    c,
    columns,
    onDelete,
    onEdit,
    r,
    rowData,
    textPosition = 'left',
  } = props

  const fname = columns[c].field
  const cell = rowData[r][fname]

  return (
    <div className="flex items-center justify-between">
      <div className={`w-full whitespace-nowrap text-${textPosition}`}>
        {cell}
      </div>
      {c === 0 && adminButtons ? (
        <AdminButtons
          onDelete={() => onDelete(r, rowData[r])}
          onEdit={() => onEdit(r)}
        />
      ) : null}
    </div>
  )
}

function Table(props) {
  const {
    adminButtons,
    columns,
    enableEdit,
    enableSort,
    extraRows,
    onDelete,
    onEdit,
    onSort,
    rowData,
    sortDirection,
    sortOn,
    textPosition,
  } = props

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < columns.length; i++) {
      row.push(
        <td key={i}>
          <TableCell
            adminButtons={adminButtons}
            c={i}
            columns={columns}
            enableEdit={enableEdit}
            r={j}
            rowData={rowData}
            textPosition={textPosition}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </td>,
      )
    }
    rows.push(<tr key={j}>{row}</tr>)
  }

  if (extraRows && extraRows.length > 0) {
    for (let j = 0; j < extraRows.length; j++) {
      const row = []
      for (let i = 0; i < columns.length; i++) {
        row.push(
          <td key={i}>
            <TableCell
              adminButtons={adminButtons}
              c={i}
              columns={columns}
              r={j}
              rowData={extraRows}
              textPosition={textPosition}
            />
          </td>,
        )
      }
      const rowClass = extraRows[j].country === 'Total' ? 'totalRow' : ''

      rows.push(
        <tr key={`er${j}`} className={styles[rowClass]}>
          {row}
        </tr>,
      )
    }
  }

  if (rows.length === 0) {
    rows.push(
      <tr key="empty">
        <td className="text-center" colSpan={columns.length}>
          Empty
        </td>
      </tr>,
    )
  }

  return (
    <table className={cx(styles.replTable, props.className)}>
      <thead>
        <tr>
          <HeaderCells
            columns={columns}
            enableSort={enableSort}
            sortDirection={sortDirection}
            sortOn={sortOn}
            onSort={onSort}
          />
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

export default Table
