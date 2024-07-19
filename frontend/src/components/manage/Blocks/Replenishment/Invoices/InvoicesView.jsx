'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceDialog from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceDialog'
import useGetInvoices from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import {
  dateForEditField,
  filterTableData,
  formatDateValue,
  formatNumberValue,
  getCountryForIso3,
  numberForEditField,
  sortTableData,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { IoSearchSharp } from 'react-icons/io5'

const MOCK_STATUSES = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
]
const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date of issuance' },
  { field: 'amount', label: 'Amount' },
  { field: 'currency', label: 'Currency' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
    subLabel: '(FERM)',
  },
  { field: 'sent_on', label: 'Sent on' },
  { field: 'reminder', label: 'Reminder sent on' },
  { field: 'files', label: 'Files' },
]

const DATA = [
  {
    amount: '123,123,123.123',
    country: 'Finland',
    date: '17-MAY-2023',
    iso3: 'FIN',
    number: '40-MFL-FIN',
    sent_out: '18-MAY-2023',
  },
]

function generateData(cs) {
  const r = []
  for (let i = 0; i < cs.length; i++) {
    r.push({
      ...DATA[0],
      country: cs[i].name_alt,
      iso3: cs[i].iso3,
      number: `${DATA[0].number.split('-').slice(0, 2).join('-')}-${cs[i].iso3}`,
    })
  }
  return r
}

const AddInvoiceDialog = function AddInvoiceDialog(props) {
  return <InvoiceDialog title="Add invoice" {...props} />
}

const EditInvoiceDialog = function EditInvoiceDialog(props) {
  return <InvoiceDialog title="Edit invoice" {...props} />
}

function InvoicesView() {
  const ctx = useContext(ReplenishmentContext)

  const { count, data, loading, results, setParams } = useGetInvoices()

  const columns = useMemo(function () {
    const result = []
    for (let i = 0; i < COLUMNS.length; i++) {
      const Label = (
        <div className="flex flex-col">
          <span>{COLUMNS[i].label}</span>
          <span className="whitespace-nowrap text-sm font-normal">
            {COLUMNS[i].subLabel}
          </span>
        </div>
      )
      result.push({
        ...COLUMNS[i],
        label: Label,
      })
    }
    return result
  }, [])

  const rows = useMemo(() => {
    return results.map((data) => ({
      amount: data.amount.toLocaleString(undefined, {
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
      }),
      country: data.country.name,
      currency: data.currency,
      date: new Date(data.date_of_issuance)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase(),
      exchange_rate: data.exchange_rate.toFixed(3),
      files:
        data.invoice_files.length > 0
          ? data.invoice_files.join(', ')
          : 'No files',
      invoice_number: data.number.toLocaleString(),
      iso3: data.country.iso3,
      reminder: data.reminder_sent_on || 'N/A',
      sent_on: new Date(data.date_sent_out)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase(),
    }))
  }, [results])

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
      entry = { ...rows[editIdx] }
      entry.date = dateForEditField(entry.date)
      entry.sent_on = dateForEditField(entry.sent_on)
      entry.amount = numberForEditField(entry.amount)
    }
    return entry
  }, [editIdx, rows])

  console.log(editData)

  function showAddInvoiceDialog() {
    setShowAdd(true)
  }

  function showEditInvoiceDialog(idx) {
    setEditIdx(idx)
  }

  function handleAddInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    entry.amount = formatNumberValue(entry.amount)
    entry.country = getCountryForIso3(entry.iso3, ctx.countries)?.name_alt
    setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
  }

  function handleDeleteInvoice(idx) {
    const confirmed = confirm('Are you sure you want to delete this invoice?')
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

  function handleEditInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    entry.amount = formatNumberValue(entry.amount)
    entry.country = getCountryForIso3(entry.iso3, ctx.countries)?.name_alt

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
        <AddInvoiceDialog
          countries={ctx.countries}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddInvoiceSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditInvoiceDialog
          columns={COLUMNS}
          countries={ctx.countries}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditInvoiceSubmit}
        />
      ) : null}
      <div className="flex items-center justify-between gap-4 pb-4 print:hidden">
        <div className="flex items-center">
          <div className="relative">
            <IoSearchSharp
              className="absolute left-3 top-1/2 -translate-y-1/2 transform text-primary"
              size={20}
            />
            <Input
              id="search"
              className="!ml-0 w-full rounded border py-2 pl-10 pr-3"
              placeholder="Search invoice..."
              type="text"
              value={searchValue}
              onChange={handleSearchInput}
            />
          </div>
          <Select
            id="country"
            className="placeholder-select"
            defaultValue=""
            required
          >
            <option value="" disabled hidden>
              Country
            </option>
            {ctx.countries.map((c) => (
              <option key={c.iso3} className="text-primary" value={c.iso3}>
                {c.name_alt}
              </option>
            ))}
          </Select>
          <Select
            id="period"
            className="placeholder-select"
            defaultValue=""
            required
          >
            <option value="" disabled hidden>
              Period
            </option>
            {[{ label: '2024-2026', value: '2024-2026' }].map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select
            id="status"
            className="placeholder-select"
            defaultValue=""
            required
          >
            <option value="" disabled hidden>
              Status
            </option>
            {MOCK_STATUSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <AddButton onClick={showAddInvoiceDialog}>Add invoice</AddButton>
      </div>
      <Table
        columns={columns}
        enableEdit={true}
        enableSort={true}
        rowData={rows}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onDelete={handleDeleteInvoice}
        onEdit={showEditInvoiceDialog}
        onSort={handleSort}
      />
    </>
  )
}

export default InvoicesView

// Year to Period (hardcoded 24-26)
// DONE: Hide Period Selector on Invoice
// DONE: Remove Status filter and column
// DONE: Remove Date of reminder issuance column
// Add debounce to search input
