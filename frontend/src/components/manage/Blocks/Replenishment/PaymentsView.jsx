'use client'

import { useImperativeHandle, useMemo, useState } from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input } from './Inputs'
import Table from './Table'
import { COUNTRIES } from './constants'
import {
  dateForEditField,
  filterTableData,
  formatDateValue,
  sortTableData,
} from './utils'

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

const AddPaymentDialog = function AddPaymentDialog(props) {
  return <PaymentDialog title="Add payment" {...props} />
}

const EditPaymentDialog = function EditPaymentDialog(props) {
  return <PaymentDialog title="Edit payment" {...props} />
}

const PaymentDialog = function PaymentDialog(props) {
  const { data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <FieldSelect id="iso3" defaultValue={data?.iso3} label="Country" required>
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label="Date"
        type="date"
        required
      />
      <FieldInput
        id="amount_usd"
        defaultValue={data?.amount_usd}
        label="Amount (USD)"
        type="text"
        required
      />
      <FieldInput
        id="amount_national"
        defaultValue={data?.amount_national}
        label="Amount (national currency)"
        type="text"
        required
      />
      <FieldInput
        id="gain_loss"
        defaultValue={data?.gain_loss}
        label="Gain / Loss"
        type="text"
        required
      />
      <FieldInput
        id="acknowledged"
        defaultChecked={data?.acknowledged}
        label="Acknowledged"
        type="checkbox"
      />
      <FieldInput
        id="promissory_note"
        defaultChecked={data?.promissory_note}
        label="Promissory note"
        type="checkbox"
      />
    </FormDialog>
  )
}

function PaymentsTable(props) {
  return <Table columns={COLUMNS} {...props} />
}

function PaymentsView(props) {
  const [tableData, setTableData] = useState(DATA)
  const [searchValue, setSearchValue] = useState('')

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...tableData[editIdx] }
      entry.acknowledged = entry.acknowledged === 'Yes' ? true : false
      entry.promissory_note = entry.promissory_note === 'Yes' ? true : false
      entry.date = dateForEditField(entry.date)
    }
    return entry
  }, [editIdx, tableData])

  const filteredTableData = useMemo(() => {
    const data = filterTableData(tableData, searchValue)
    return sortTableData(data, COLUMNS[sortOn].field, sortDirection)
  }, [tableData, searchValue, sortOn, sortDirection])

  function showAddPaymentDialog() {
    setShowAdd(true)
  }

  function showEditPaymentDialog(idx) {
    setEditIdx(idx)
  }

  function handleAddPaymentSubmit(data) {
    const entry = { ...data }
    entry.acknowledged = !entry.acknowledged ? 'No' : 'Yes'
    entry.promissory_note = !entry.promissory_note ? 'No' : 'Yes'
    entry.date = formatDateValue(entry.date)
    setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
  }

  function handleDeletePayment(idx) {
    const confirmed = confirm('Are you sure you want to delete this payment?')
    if (confirmed) {
      setTableData((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
    }
  }

  function handleEditPaymentSubmit(data) {
    const entry = { ...data }
    entry.acknowledged = !entry.acknowledged ? 'No' : 'Yes'
    entry.promissory_note = !entry.promissory_note ? 'No' : 'Yes'
    entry.date = formatDateValue(entry.date)
    setTableData((prev) => {
      const next = [...prev]
      next[editIdx] = entry
      return next
    })
    setEditIdx(null)
  }

  function handleSearchInput(evt) {
    setSearchValue(evt.target.value)
  }

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  return (
    <>
      {showAdd ? (
        <AddPaymentDialog
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddPaymentSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditPaymentDialog
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditPaymentSubmit}
        />
      ) : null}
      <div className="flex items-center py-4">
        <AddButton onClick={showAddPaymentDialog}>Add payment</AddButton>
        <div className="ml-8">
          <label>
            Search:{' '}
            <Input
              id="search"
              type="text"
              value={searchValue}
              onChange={handleSearchInput}
            />
          </label>
        </div>
      </div>
      <PaymentsTable
        enableEdit={true}
        enableSort={true}
        rowData={filteredTableData}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onDelete={handleDeletePayment}
        onEdit={showEditPaymentDialog}
        onSort={handleSort}
      />
    </>
  )
}

export default PaymentsView
