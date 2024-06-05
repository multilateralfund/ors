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
  { field: 'amount_usd', label: 'Amount (USD)' },
  { field: 'amount_national', label: 'Amount (national currency)' },
  { field: 'gain_loss', label: 'Gain / Loss' },
  { field: 'acknowledged', label: 'Acknowledged' },
  { field: 'promissory_note', label: 'Promissory note' },
]

const DATA = [
  {
    acknowledged: 'Yes',
    amount_national: '1,300,000.0000',
    amount_usd: '1,000,000.0000',
    country: 'Finland',
    date: '17-MAY-2022',
    gain_loss: '100,000.0000',
    iso3: 'FIN',
    promissory_note: 'No',
  },
  {
    acknowledged: 'No',
    amount_national: '1,300,000.0000',
    amount_usd: '1,000,000.0000',
    country: 'Finland',
    date: '17-MAY-2023',
    gain_loss: '-100,000.0000',
    iso3: 'FIN',
    promissory_note: 'Yes',
  },
]

function populateData() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    DATA.push({
      ...DATA[i % 2],
      country: COUNTRIES[i].name_alt,
      iso3: COUNTRIES[i].iso3,
    })
  }
  DATA.splice(0, 2)
}

populateData()

const AddPaymentDialog = forwardRef(function AddPaymentDialog(props, ref) {
  return (
    <AddDialog ref={ref} title="Add payment" {...props}>
      <FieldSelect id="iso3" label="Country" required>
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput id="date" label="Date" type="date" required />
      <FieldInput id="amount_usd" label="Amount (USD)" type="text" required />
      <FieldInput
        id="amount_national"
        label="Amount (national currency)"
        type="text"
        required
      />
      <FieldInput id="gain_loss" label="Gain / Loss" type="text" required />
      <FieldInput id="acknowledged" label="Acknowledged" type="checkbox" />
      <FieldInput
        id="promissory_note"
        label="Promissory note"
        type="checkbox"
      />
    </AddDialog>
  )
})

function PaymentsTable(props) {
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

function PaymentsView(props) {
  const [tableData, setTableData] = useState(DATA)

  const addInvoiceModal = useRef(null)

  function showAddPaymentModal() {
    addInvoiceModal.current.show()
  }

  function handleAddPaymentSubmit(data) {
    const entry = { ...data }
    entry.acknowledged = !entry.acknowledged ? 'No' : 'Yes'
    entry.promissory_note = !entry.promissory_note ? 'No' : 'Yes'
    entry.date = formatDateValue(entry.date)
    setTableData((prev) => [entry, ...prev])
  }

  return (
    <>
      <AddPaymentDialog
        ref={addInvoiceModal}
        onSubmit={handleAddPaymentSubmit}
      />
      <div className="flex items-center py-4">
        <AddButton onClick={showAddPaymentModal}>Add payment</AddButton>
      </div>
      <PaymentsTable rowData={tableData} />
    </>
  )
}

export default PaymentsView
