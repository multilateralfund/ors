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
  { field: 'sent_out', label: 'Sent out' },
  { field: 'number', label: 'Number' },
]

const DATA: any[] = [
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

const AddInvoiceDialog = forwardRef(function AddInvoiceDialog(
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
        <h3 className="m-0 text-xl">Add invoice</h3>
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
          <label className="inline-block w-32" htmlFor="number">
            Invoice number
          </label>
          <input
            id="number"
            name="number"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="text"
            required
          />
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
          <label className="inline-block w-32" htmlFor="sent_out">
            Sent out
          </label>
          <input
            id="sent_out"
            name="sent_out"
            className="ml-4 rounded-lg border border-solid border-primary bg-white px-4 py-2"
            type="date"
            required
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

function InvoicesTable(props: any) {
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

function InvoicesView(props: any) {
  const [tableData, setTableData] = useState(DATA)

  const addInvoiceModal = useRef<any>(null)

  function showAddInvoiceModal() {
    addInvoiceModal.current.show()
  }

  function handleAddInvoiceSubmit(data: any) {
    setTableData((prev) => [data, ...prev])
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