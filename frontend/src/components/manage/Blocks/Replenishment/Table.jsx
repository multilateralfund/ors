import { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import styles from './table.module.css'

import { IoChevronDown, IoChevronUp, IoPencil, IoTrash } from 'react-icons/io5'

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
  const { c, columns, enableEdit, onCellEdit, onDelete, onEdit, r, rowData } =
    props

  const fname = columns[c].field
  const cell = rowData[r][fname]
  const initialValue = cell?.edit ?? cell
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
        <AdminButtons onDelete={() => onDelete(r)} onEdit={() => onEdit(r)} />
      ) : null}
    </div>
  )
}

function Table(props) {
  const {
    columns,
    enableEdit,
    enableSort,
    extraRows,
    onCellEdit,
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
          <TableCell
            c={i}
            columns={columns}
            enableEdit={enableEdit}
            r={j}
            rowData={rowData}
            onCellEdit={onCellEdit}
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
