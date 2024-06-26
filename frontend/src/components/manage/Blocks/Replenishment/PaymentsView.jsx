'use client'

import {
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input } from './Inputs'
import Table from './Table'
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

function generateData(cs) {
  const r = []
  for (let i = 0; i < cs.length; i++) {
    r.push({
      ...DATA[i % 2],
      country: cs[i].name_alt,
      iso3: cs[i].iso3,
    })
  }
  return r
}

const AddPaymentDialog = function AddPaymentDialog(props) {
  return <PaymentDialog title="Add payment" {...props} />
}

const EditPaymentDialog = function EditPaymentDialog(props) {
  return <PaymentDialog title="Edit payment" {...props} />
}

const PaymentDialog = function PaymentDialog(props) {
  const { countries, data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <FieldSelect id="iso3" defaultValue={data?.iso3} label="Country" required>
        <option value=""> - </option>
        {countries.map((c) => (
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
  const ctx = useContext(ReplenishmentContext)

  const [tableData, setTableData] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(
    function () {
      setTableData(generateData(ctx.countries))
    },
    [ctx],
  )

  const filteredTableData = useMemo(
    function () {
      return filterTableData(tableData, searchValue)
    },
    [tableData, searchValue],
  )

  const sortedTableData = useMemo(
    function () {
      return sortTableData(
        filteredTableData,
        COLUMNS[sortOn].field,
        sortDirection,
      )
    },
    [filteredTableData, sortOn, sortDirection],
  )

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...sortedTableData[editIdx] }
      entry.acknowledged = entry.acknowledged === 'Yes' ? true : false
      entry.promissory_note = entry.promissory_note === 'Yes' ? true : false
      entry.date = dateForEditField(entry.date)
    }
    return entry
  }, [editIdx, sortedTableData])

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
        const next = []
        for (let i = 0; i < sortedTableData.length; i++) {
          if (i !== idx) {
            next.push(sortedTableData[i])
          }
        }
        return next
      })
    }
  }

  function handleEditPaymentSubmit(data) {
    const entry = { ...data }
    entry.acknowledged = !entry.acknowledged ? 'No' : 'Yes'
    entry.promissory_note = !entry.promissory_note ? 'No' : 'Yes'
    entry.date = formatDateValue(entry.date)

    const next = [...sortedTableData]
    next[editIdx] = entry

    setTableData(next)
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
          countries={ctx.countries}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddPaymentSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditPaymentDialog
          countries={ctx.countries}
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
        rowData={sortedTableData}
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
