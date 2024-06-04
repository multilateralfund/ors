'use client'

import { forwardRef, useRef, useState } from 'react'

import cx from 'classnames'

import { robotoCondensed } from '@ors/themes/fonts'

import { COUNTRIES, PERIOD } from './constants'
import styles from './table.module.css'

import { IoAddCircle, IoCloseCircle } from 'react-icons/io5'

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
  DATA.shift()
}

populateData()

function Button(props: any) {
  const { children, className, onClick, ...rest } = props
  return (
    <button
      className={cx(
        'flex cursor-pointer items-center rounded-lg border border-solid px-3 py-2.5 text-base font-medium uppercase transition-all',
        robotoCondensed.className,
        className,
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}

function CancelButton(props: any) {
  return (
    <Button
      className="border-gray-600 bg-gray-600 text-white outline-1 outline-primary hover:outline"
      type="button"
      {...props}
    >
      Cancel
    </Button>
  )
}

function SubmitButton(props: any) {
  return (
    <Button
      className="border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow"
      type="submit"
      {...props}
    >
      Submit
    </Button>
  )
}

function AddButton(props: any) {
  return (
    <Button
      className="border-primary bg-white text-primary hover:bg-primary hover:text-mlfs-hlYellow"
      {...props}
    >
      Add invoice
      <IoAddCircle className="ml-1.5" size={18} />
    </Button>
  )
}

const AddInvoiceDialog = forwardRef(function AddInvoiceDialog(
  props: any,
  ref: any,
) {
  const { onSubmit } = props

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
    ref.current.close()
    onSubmit(data, evt)
  }

  return (
    <dialog
      className="max-h-2/3 justify-between overflow-scroll rounded-xl border-none bg-white p-8 shadow-2xl"
      ref={ref}
    >
      <div className="mb-8 flex items-center justify-between text-secondary">
        <h3 className="m-0 text-xl">Add invoice</h3>
        <IoCloseCircle
          className="cursor-pointer transition-all hover:rotate-90"
          size={32}
          onClick={() => ref.current.close()}
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
          <CancelButton onClick={() => ref.current.close()} />
          <SubmitButton />
        </div>
      </form>
    </dialog>
  )
})

function InvoicesTable(props: any) {
  const { period, rowData } = props

  const hCols = []
  for (let i = 0; i < COLUMNS.length; i++) {
    hCols.push(<th key={i}>{COLUMNS[i].label.replace('[PERIOD]', period)}</th>)
  }

  const rows = []
  for (let j = 0; j < rowData.length; j++) {
    const row = []
    for (let i = 0; i < COLUMNS.length; i++) {
      row.push(<td key={i}>{rowData[j % rowData.length][COLUMNS[i].field]}</td>)
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
  const period = props.period ?? PERIOD

  const [tableData, setTableData] = useState(DATA)

  const addInvoiceModal = useRef<any>(null)

  function showAddInvoiceModal() {
    if (addInvoiceModal.current) {
      addInvoiceModal.current.showModal()
    }
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
        <AddButton onClick={showAddInvoiceModal} />
      </div>
      <InvoicesTable period={period} rowData={tableData} />
    </>
  )
}

export default InvoicesView
