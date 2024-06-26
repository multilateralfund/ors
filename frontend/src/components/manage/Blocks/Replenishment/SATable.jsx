import { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import HeaderCells from './Table/HeaderCells'
import styles from './Table/table.module.css'

import { IoPencil, IoTrash } from 'react-icons/io5'

function AdminButtons(props) {
  const { onDelete } = props
  return (
    <div className={styles.adminButtons}>
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

function TableCell(props) {
  const { c, columns, enableEdit, onCellEdit, onDelete, r, rowData } = props

  const fname = columns[c].field
  const cell = rowData[r][fname]
  const initialValue = cell?.hasOwnProperty('edit') ? cell.edit || '' : cell
  const isEditable = columns[c].editable === true

  useEffect(
    function () {
      setValue(initialValue)
    },
    [initialValue],
  )

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)

  const inputRef = useRef(null)

  useEffect(
    function () {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    },
    [editing],
  )

  function handleStartEdit() {
    if (enableEdit && isEditable) {
      setEditing(true)
    }
  }

  function handleKeyDown(evt) {
    if (evt.key === 'Escape') {
      cancelNewValue()
    } else if (evt.key === 'Enter') {
      saveNewValue()
    } else if (evt.key === 'Tab') {
      evt.preventDefault()
      saveNewValue()
    }
  }

  function cancelNewValue() {
    setValue(initialValue)
    setEditing(false)
  }

  function saveNewValue() {
    onCellEdit(r, c, fname, value)
    setEditing(false)
  }

  return (
    <div
      className="flex items-center justify-between"
      onDoubleClick={handleStartEdit}
    >
      <div className="w-full whitespace-nowrap">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onBlur={saveNewValue}
            onChange={(evt) => setValue(evt.target.value)}
            onKeyDown={handleKeyDown}
          />
        ) : (
          cell?.view ?? cell
        )}
      </div>
      {c === 0 && enableEdit && !editing ? (
        <AdminButtons onDelete={() => onDelete(r)} />
      ) : null}
    </div>
  )
}

function SATable(props) {
  const {
    columns,
    enableEdit,
    enableSort,
    extraRows,
    onCellEdit,
    onDelete,
    onSort,
    rowData,
    sortDirection,
    sortOn,
  } = props

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < columns.length; i++) {
      row.push(
        <td key={i}>
          <TableCell
            c={i}
            columns={columns}
            enableEdit={enableEdit}
            r={j}
            rowData={rowData}
            onCellEdit={onCellEdit}
            onDelete={onDelete}
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
            <TableCell c={i} columns={columns} r={j} rowData={extraRows} />
          </td>,
        )
      }
      rows.push(<tr key={`er${j}`}>{row}</tr>)
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
    <table
      className={cx(
        styles.replTable,
        styles.replenishmentTable,
        props.className,
      )}
    >
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

export default SATable
