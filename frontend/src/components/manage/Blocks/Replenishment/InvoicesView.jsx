'use client'

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import Dialog from './Dialog'
import { FieldInput, FieldSelect } from './Inputs'
import { COUNTRIES } from './constants'
import styles from './table.module.css'
import { dateForEditField, formatDateValue } from './utils'

import { IoPencil, IoTrash } from 'react-icons/io5'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'sent_out', label: 'Sent out' },
  { field: 'number', label: 'Number' },
]

const DATA = [
  {
    country: 'Finland',
    date: '17-MAY-2023',
    iso3: 'FIN',
    number: '40-MFL-FIN',
    sent_out: '18-MAY-2023',
  },
]

function populateData() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    DATA.push({
      ...DATA[0],
      country: COUNTRIES[i].name_alt,
      iso3: COUNTRIES[i].iso3,
      number: `${DATA[0].number.split('-').slice(0, 2).join('-')}-${COUNTRIES[i].iso3}`,
    })
  }
  DATA.splice(0, 1)
}

populateData()

const AddInvoiceDialog = forwardRef(function AddInvoiceDialog(props, ref) {
  return (
    <Dialog ref={ref} title="Add invoice" {...props}>
      <FieldSelect id="iso3" label="Country" required>
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput id="number" label="Invoice number" type="text" required />
      <FieldInput id="date" label="Date" type="date" required />
      <FieldInput id="sent_out" label="Sent out" type="date" required />
    </Dialog>
  )
})

const EditInvoiceDialog = forwardRef(function AddInvoiceDialog(props, ref) {
  const { data } = props

  return (
    <Dialog ref={ref} title="Edit invoice" {...props}>
      <FieldSelect
        id="iso3"
        label="Country"
        value={data.iso3}
        disabled
        required
      >
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="number"
        defaultValue={data.number}
        label="Invoice number"
        type="text"
        required
      />
      <FieldInput
        id="date"
        defaultValue={data.date}
        label="Date"
        type="date"
        required
      />
      <FieldInput
        id="sent_out"
        defaultValue={data.sent_out}
        label="Sent out"
        type="date"
        required
      />
    </Dialog>
  )
})

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

function InvoicesTable(props) {
  const { enableEdit, onDelete, onEdit, rowData } = props

  const hCols = []
  for (let i = 0; i < COLUMNS.length; i++) {
    hCols.push(<th key={i}>{COLUMNS[i].label}</th>)
  }

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < COLUMNS.length; i++) {
      row.push(
        <td key={i}>
          <div className="flex justify-between">
            {rowData[j][COLUMNS[i].field]}
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

function InvoicesView(props) {
  const [tableData, setTableData] = useState(DATA)
  const [editIdx, setEditIdx] = useState(null)

  const addInvoiceDialog = useRef(null)
  const editInvoiceDialog = useRef(null)

  const editData = useMemo(() => {
    let entry = {}
    if (editIdx !== null) {
      entry = { ...tableData[editIdx] }
      entry.date = dateForEditField(entry.date)
      entry.sent_out = dateForEditField(entry.sent_out)
    }
    return entry
  }, [editIdx, tableData])

  function showAddInvoiceDialog() {
    addInvoiceDialog.current.show()
  }

  function showEditInvoiceDialog(idx) {
    setEditIdx(idx)
    editInvoiceDialog.current.show()
  }

  function handleAddInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    setTableData((prev) => [entry, ...prev])
  }

  function handleDeleteInvoice(idx) {
    const confirmed = confirm('Are you sure you want to delete this entry?')
    if (confirmed) {
      setTableData((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
    }
  }

  function handleEditInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    setTableData((prev) => {
      const next = [...prev]
      next[editIdx] = entry
      return next
    })
  }

  return (
    <>
      <AddInvoiceDialog
        ref={addInvoiceDialog}
        onSubmit={handleAddInvoiceSubmit}
      />
      <EditInvoiceDialog
        data={editData}
        ref={editInvoiceDialog}
        onSubmit={handleEditInvoiceSubmit}
      />
      <div className="flex items-center py-4">
        <AddButton onClick={showAddInvoiceDialog}>Add invoice</AddButton>
      </div>
      <InvoicesTable
        enableEdit={true}
        rowData={tableData}
        onDelete={handleDeleteInvoice}
        onEdit={showEditInvoiceDialog}
      />
    </>
  )
}

export default InvoicesView
