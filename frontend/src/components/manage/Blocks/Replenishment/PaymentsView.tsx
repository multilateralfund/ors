'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import {
  AddButton,
  CancelButton,
  SubmitButton,
} from '@ors/components/ui/Button/Button'

import { COUNTRIES } from './constants'
import styles from './table.module.css'

import { IoCloseCircle } from 'react-icons/io5'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'amount_usd', label: 'Amount (USD)' },
  { field: 'amount_national', label: 'Amount (national currency)' },
  { field: 'gain_loss', label: 'Gain / Loss' },
  { field: 'acknowledged', label: 'Acknowledged' },
  { field: 'promissory_note', label: 'Promissory note' },
]

const DATA: any[] = [
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

const AddPaymentDialog = forwardRef(function AddPaymentDialog(
  props: any,
  ref: any,
) {
  const { onSubmit } = props
  const dialogRef = useRef<any>(null)

  useImperativeHandle(
    ref,
    () => {
      return {
        hide() {
          dialogRef.current.close()
        },
        show() {
          dialogRef.current.showModal()
        },
      }
    },
    [],
  )

  function submitHandler(evt: any) {
    evt.preventDefault()
    const formData = new FormData(evt.target)
    const data: any = {
      country: evt.target.iso3.querySelector(
        `option[value=${evt.target.iso3.value}]`,
      ).dataset.name,
    }
    for (const [k, v] of formData.entries()) {
      data[k] = v
    }
    dialogRef.current.close()
    onSubmit(data, evt)
  }

  return (
    <dialog
      className="max-h-2/3 justify-between rounded-xl border-none bg-white p-8 shadow-2xl"
      ref={dialogRef}
    >
      <div className="mb-8 flex items-center justify-between text-secondary">
        <h3 className="m-0 text-xl">Add payment</h3>
        <IoCloseCircle
          className="cursor-pointer transition-all hover:rotate-90"
          size={32}
          onClick={() => dialogRef.current.close()}
        />
      </div>
      <form onSubmit={submitHandler}>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="iso3">
            Country
          </label>
          <select
            id="iso3"
            name="iso3"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            required
          >
            <option value=""> - </option>
            {COUNTRIES.map((c) => (
              <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
                {c.name_alt}
              </option>
            ))}
          </select>
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="date"
            required
          />
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="amount_usd">
            Amount (USD)
          </label>
          <input
            id="amount_usd"
            name="amount_usd"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="text"
            required
          />
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="amount_national">
            Amount (national currency)
          </label>
          <input
            id="amount_national"
            name="amount_national"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="text"
            required
          />
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="gain_loss">
            Gain / Loss
          </label>
          <input
            id="gain_loss"
            name="gain_loss"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="text"
            required
          />
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="acknowledged">
            Acknowledged
          </label>
          <input
            id="acknowledged"
            name="acknowledged"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="checkbox"
          />
        </div>
        <div className="my-2">
          <label className="inline-block w-32" htmlFor="promissory_note">
            Promissory note
          </label>
          <input
            id="promissory_note"
            name="promissory_note"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="checkbox"
          />
        </div>
        <div className="mt-8 flex items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
          <CancelButton onClick={() => dialogRef.current.close()}>
            Cancel
          </CancelButton>
          <SubmitButton>Submit</SubmitButton>
        </div>
      </form>
    </dialog>
  )
})

function PaymentsTable(props: any) {
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

function formatDateValue(value: string) {
  const intl = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const date = new Date(Date.parse(value))
  return `${date.getDate()}-${intl.format(date).toUpperCase()}-${date.getFullYear()}`
}

function PaymentsView(props: any) {
  const [tableData, setTableData] = useState(DATA)

  const addInvoiceModal = useRef<any>(null)

  function showAddPaymentModal() {
    addInvoiceModal.current.show()
  }

  function handleAddPaymentSubmit(data: any) {
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
