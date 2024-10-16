import {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import ConfirmDialog from '../ConfirmDialog'
import HeaderCells from '../Table/HeaderCells'
import styles from '../Table/table.module.css'
import { ConfirmDialogProps } from '../types'
import {
  AddRowProps,
  EditFieldProps,
  SATableAdminButtonsProps,
  SATableCellProps,
  SATableProps,
  ViewFieldProps,
} from './types'

import { IoAlertCircle, IoArrowUndo, IoTrash } from 'react-icons/io5'

function ConfirmEditDialog(props: Omit<ConfirmDialogProps, 'title'>) {
  return <ConfirmDialog title="Change this system computed value?" {...props} />
}

function AdminButtons(props: SATableAdminButtonsProps) {
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

function RevertButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, onClick, ...rest } = props
  return (
    <button
      className={cx(
        '-mr-2 cursor-pointer border-none bg-transparent p-0 text-secondary',
        className,
      )}
      title="Discard override and revert to initial value."
      type="button"
      onClick={onClick}
      {...rest}
    >
      <IoArrowUndo />
    </button>
  )
}

function ViewField(props: ViewFieldProps) {
  const { cell, enableEdit, onRevert } = props

  if (cell?.isEditable) {
    return (
      <div className="flex items-center justify-between">
        <span
          className={`w-full text-center ${cell.hasOverride ? 'text-secondary' : ''}`}
        >
          {cell.view}
        </span>
        {cell.hasOverride ? (
          <RevertButton onClick={onRevert} />
        ) : (
          enableEdit && (
            <span className="text-gray-400 print:hidden">{'\u22EE'}</span>
          )
        )}
      </div>
    )
  } else {
    return <div className="text-center">{cell?.view}</div>
  }
}

function EditField(props: EditFieldProps) {
  const { column, value, ...rest } = props

  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  const fieldValue = column.editParser ? column.editParser(value) : value

  useEffect(function () {
    if (selectRef.current) {
      selectRef.current.focus()
    } else if (inputRef.current) {
      inputRef.current.select()
    }
  }, [])

  let Field

  switch (column.editWidget) {
    case 'select':
      const options = []
      const editOptions = column.editOptions ?? []
      for (let i = 0; i < editOptions.length; i++) {
        options.push(
          <option key={i} value={editOptions[i].value}>
            {editOptions[i].label}
          </option>,
        )
      }
      Field = (
        <select ref={selectRef} value={fieldValue} {...rest}>
          {options}
        </select>
      )
      break
    default:
      Field = <input ref={inputRef} value={fieldValue} {...rest} />
  }

  return Field
}

function TableCell(props: SATableCellProps) {
  const {
    c,
    columns,
    enableEdit,
    onCellEdit,
    onCellRevert,
    onDelete,
    r,
    rowData,
  } = props

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

  const invalidMessage = useMemo(
    function () {
      const parsedValue = column.parser ? column.parser(value) : value
      return column.validator ? column.validator(parsedValue) : ''
    },
    [value, column],
  )

  const [showConfirmEdit, setShowConfirmEdit] = useState(false)

  function handleStartEdit() {
    if (enableEdit && cell?.isEditable === true) {
      setEditing(true)
    }
  }

  const handleKeyDown: KeyboardEventHandler = (evt) => {
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
      if (!invalidMessage) {
        if (confirmationText) {
          setShowConfirmEdit(true)
        } else {
          onCellEdit!(r, c, fname, value)
          setEditing(false)
        }
      }
    } else {
      setEditing(false)
    }
  }

  function handleConfirmEdit() {
    onCellEdit!(r, c, fname, value)
    setEditing(false)
    setShowConfirmEdit(false)
  }

  function handleCancelEdit() {
    setShowConfirmEdit(false)
    cancelNewValue()
  }

  const handleChangeValue: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (evt) => {
    setValue(evt.target.value)
  }

  function handleRevert() {
    onCellRevert!(r, fname)
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
          <div className="flex items-center gap-x-2">
            <EditField
              className={cx('w-full', {
                'text-error outline outline-2 outline-error': invalidMessage,
              })}
              column={columns[c]}
              value={value}
              onBlur={saveNewValue}
              onChange={handleChangeValue}
              onKeyDown={handleKeyDown}
            />
            {invalidMessage ? (
              <IoAlertCircle
                className="text-error"
                size={24}
                title={invalidMessage}
              />
            ) : null}
          </div>
        ) : (
          <ViewField
            cell={cell}
            enableEdit={enableEdit}
            onRevert={handleRevert}
          />
        )}
      </div>
      {c === 0 && enableEdit && !editing ? (
        <AdminButtons onDelete={() => onDelete!(r)} />
      ) : null}
    </div>
  )
}

function AddRow(props: AddRowProps) {
  const { columns, countries, onCancel, onSubmit } = props

  const [countryIdx, setCountryIdx] = useState<'' | number>('')

  const countryOptions = []

  for (let i = 0; i < countries.length; i++) {
    countryOptions.push(
      <option key={countries[i].id} value={i}>
        {countries[i].name_alt}
      </option>,
    )
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault()
    onSubmit(countries[countryIdx as number])
  }

  const handleChangeCountryIdx: ChangeEventHandler<HTMLSelectElement> = (
    evt,
  ) => {
    setCountryIdx(parseInt(evt.target.value, 10))
  }

  return (
    <tr className="bg-gray-100 print:hidden">
      <td colSpan={columns.length}>
        <form className="flex items-center gap-x-4" onSubmit={handleSubmit}>
          <select value={countryIdx} onChange={handleChangeCountryIdx} required>
            <option value="">Select a country...</option>
            {countryOptions}
          </select>
          <SubmitButton className="!py-1 !text-sm">Confirm</SubmitButton>
          <CancelButton className="!py-1 !text-sm" onClick={onCancel}>
            Cancel
          </CancelButton>
        </form>
      </td>
    </tr>
  )
}

function SATable(props: SATableProps) {
  const {
    columns,
    countriesForAdd,
    enableEdit,
    enableSort,
    extraRows,
    onAddCancel,
    onAddSubmit,
    onCellEdit,
    onCellRevert,
    onDelete,
    onSort,
    rowData,
    showAdd,
    sortDirection,
    sortOn,
  } = props

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < columns.length; i++) {
      row.push(
        <td key={i} className={cx(columns[i].className)}>
          <TableCell
            c={i}
            columns={columns}
            enableEdit={enableEdit}
            r={j}
            rowData={rowData}
            onCellEdit={onCellEdit}
            onCellRevert={onCellRevert}
            onDelete={onDelete}
          />
        </td>,
      )
    }
    rows.push(
      <tr
        key={j}
        className={cx('!duration-1000 ease-in-out transition-all', {
          isNew: rowData[j].isNew,
        })}
      >
        {row}
      </tr>,
    )
  }

  if (showAdd) {
    rows.push(
      <AddRow
        key="addRow"
        columns={columns}
        countries={countriesForAdd}
        onCancel={onAddCancel}
        onSubmit={onAddSubmit}
      />,
    )
  }

  if (extraRows && extraRows.length > 0) {
    for (let j = 0; j < extraRows.length; j++) {
      const row = []
      for (let i = 0; i < columns.length; i++) {
        row.push(
          <td key={i} className={cx(columns[i].className)}>
            <TableCell
              c={i}
              columns={columns}
              enableEdit={enableEdit}
              r={j}
              rowData={extraRows}
            />
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
