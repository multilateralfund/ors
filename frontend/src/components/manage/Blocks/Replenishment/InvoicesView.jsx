'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import AddDialog from './AddDialog'
import { FieldInput, FieldSelect } from './Inputs'
import { COUNTRIES } from './constants'
import styles from './table.module.css'
import { formatDateValue } from './utils'

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
    <AddDialog ref={ref} title="Add invoice" {...props}>
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
    </AddDialog>
  )
})

function InvoicesTable(props) {
  const { rowData } = props

  const hCols = []
  for (let i = 0; i < COLUMNS.length; i++) {
    hCols.push(<th key={i}>{COLUMNS[i].label}</th>)
  }

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < COLUMNS.length; i++) {
      row.push(<td key={i}>{rowData[j][COLUMNS[i].field]}</td>)
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

  const addInvoiceModal = useRef(null)

  function showAddInvoiceModal() {
    addInvoiceModal.current.show()
  }

  function handleAddInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    setTableData((prev) => [entry, ...prev])
  }

  return (
    <>
      <AddInvoiceDialog
        ref={addInvoiceModal}
        onSubmit={handleAddInvoiceSubmit}
      />
      <div className="flex items-center py-4">
        <AddButton onClick={showAddInvoiceModal}>Add invoice</AddButton>
      </div>
      <InvoicesTable rowData={tableData} />
    </>
  )
}

export default InvoicesView
