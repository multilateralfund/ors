import { useEffect, useRef, useState } from 'react'

import cx from 'classnames'

import ConfirmDialog from '../ConfirmDialog'
import HeaderCells from '../Table/HeaderCells'
import styles from '../Table/table.module.css'

import { IoPencil, IoTrash } from 'react-icons/io5'

function ConfirmEditDialog(props) {
  return <ConfirmDialog title="Change this system computed value?" {...props} />
}

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

function EditField(props) {
  const { column, value, ...rest } = props

  const inputRef = useRef(null)

  const fieldValue = column.editParser ? column.editParser(value) : value

  useEffect(function () {
    if (inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.nodeName === 'INPUT') {
        inputRef.current.select()
      }
    }
  }, [])

  let Field

  switch (column.editWidget) {
    case 'select':
      const options = []
      for (let i = 0; i < column.editOptions.length; i++) {
        options.push(
          <option key={i} value={column.editOptions[i].value}>
            {column.editOptions[i].label}
          </option>,
        )
      }
      Field = (
        <select className="w-full" ref={inputRef} value={fieldValue} {...rest}>
          {options}
        </select>
      )
      break
    default:
      Field = <input ref={inputRef} value={fieldValue} {...rest} />
  }

  return Field
}

function TableCell(props) {
  const { c, columns, enableEdit, onCellEdit, onDelete, r, rowData } = props

  const column = columns[c]
  const fname = column.field
  const cell = rowData[r][fname]
  const initialValue = cell?.hasOwnProperty('edit') ? cell.edit || '' : cell

  const confirmationText = columns[c].confirmationText ?? null

  useEffect(
    function () {
      setValue(initialValue)
    },
    [initialValue],
  )

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)

  const [showConfirmEdit, setShowConfirmEdit] = useState(false)

  function handleStartEdit() {
    if (enableEdit && column.editable === true) {
      setEditing(true)
    }
  }

  function handleKeyDown(evt) {
    if (evt.key === 'Escape') {
      cancelNewValue()
    } else if (evt.key === 'Enter') {
      evt.preventDefault()
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
    if (value !== initialValue) {
      if (confirmationText) {
        setShowConfirmEdit(true)
      } else {
        onCellEdit(r, c, fname, value)
        setEditing(false)
      }
    } else {
      setEditing(false)
    }
  }

  function handleConfirmEdit() {
    onCellEdit(r, c, fname, value)
    setEditing(false)
    setShowConfirmEdit(false)
  }

  function handleCancelEdit() {
    setShowConfirmEdit(false)
    cancelNewValue()
  }

  function handleChangeValue(evt) {
    const inputValue = evt.target.value
    let newValue = column.parser ? column.parser(inputValue) : inputValue
    if (isNaN(newValue) && typeof initialValue === 'number') {
      newValue = ''
    }
    setValue(newValue)
  }

  return (
    <div
      className="flex items-center justify-between"
      onDoubleClick={handleStartEdit}
    >
      {showConfirmEdit ? (
        <ConfirmEditDialog
          onCancel={handleCancelEdit}
          onSubmit={handleConfirmEdit}
        >
          <div className="text-lg">{confirmationText}</div>
        </ConfirmEditDialog>
      ) : null}
      <div className="w-full whitespace-nowrap">
        {editing ? (
          <EditField
            column={columns[c]}
            value={value}
            onBlur={saveNewValue}
            onChange={handleChangeValue}
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
