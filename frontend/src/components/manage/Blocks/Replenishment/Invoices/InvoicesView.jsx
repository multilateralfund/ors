'use client'

import React, { useContext, useMemo, useState } from 'react'

import { times } from 'lodash'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceDialog from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceDialog'
import useGetInvoices, {
  _PER_PAGE,
} from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import {
  dateForEditField,
  formatDateValue,
  formatNumberValue,
  numberForEditField,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { IoSearchSharp } from 'react-icons/io5'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'number', label: 'Invoice number' },
  { field: 'date_of_issuance', label: 'Date of issuance', sortable: true },
  { field: 'amount', label: 'Amount', sortable: true },
  { field: 'currency', label: 'Currency' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
    subLabel: '(FERM)',
  },
  { field: 'date_sent_out', label: 'Sent on', sortable: true },
  { field: 'reminder', label: 'Reminder sent on' },
  { field: 'files', label: 'Files' },
]

const MOCK_PERIODS = ['2024-2026', '2021-2023']

const AddInvoiceDialog = function AddInvoiceDialog(props) {
  return <InvoiceDialog title="Add invoice" {...props} />
}

const EditInvoiceDialog = function EditInvoiceDialog(props) {
  return <InvoiceDialog title="Edit invoice" isEdit {...props} />
}

function InvoicesView() {
  const ctx = useContext(ReplenishmentContext)

  const { count, loaded, results, setParams } = useGetInvoices()
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: _PER_PAGE,
  })
  const memoResults = useMemo(() => {
    if (!loaded) {
      return times(pagination.rowsPerPage, (num) => {
        return {
          id: num + 1,
          isSkeleton: true,
        }
      })
    }
    return [
      ...results.map((data) => ({
        amount: data.amount.toLocaleString(undefined, {
          maximumFractionDigits: 3,
          minimumFractionDigits: 3,
        }),
        country: data.country.name,
        country_id: data.country.id,
        currency: data.currency,
        date_of_issuance: formatDateValue(data.date_of_issuance),
        date_sent_out: formatDateValue(data.date_sent_out),
        exchange_rate: data.exchange_rate.toFixed(3),
        files:
          data.invoice_files.length > 0
            ? data.invoice_files.join(', ')
            : 'No files',
        invoice_number: data.number.toLocaleString(),
        iso3: data.country.iso3,
        number: data.number,
        reminder: data.reminder_sent_on || 'N/A',
      })),
    ]
  }, [results, loaded, pagination.rowsPerPage])

  const pages = Math.ceil(count / pagination.rowsPerPage)

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

  const [sortOn, setSortOn] = useState(2)
  const [sortDirection, setSortDirection] = useState(-1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...memoResults[editIdx] }
      entry.date_of_issuance = dateForEditField(entry.date_of_issuance)
      entry.date_sent_out = dateForEditField(entry.date_sent_out)
      entry.reminder = dateForEditField(entry.reminder)
      entry.amount = numberForEditField(entry.amount)
    }
    return entry
  }, [editIdx, memoResults])

  function showEditInvoiceDialog(idx) {
    setEditIdx(idx)
  }

  function handleAddInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date_of_issuance = formatDateValue(entry.date_of_issuance)
    entry.date_sent_out = formatDateValue(entry.date_sent_out)
    entry.reminder = formatDateValue(entry.reminder)
    entry.amount = formatNumberValue(entry.amount)
    // setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
    console.log('Add invoice', entry)
  }

  function handleDeleteInvoice(idx) {
    const confirmed = confirm('Are you sure you want to delete this invoice?')
    if (confirmed) {
      // setTableData((prev) => {
      //   const next = []
      //   for (let i = 0; i < sortedTableData.length; i++) {
      //     if (i !== idx) {
      //       next.push(sortedTableData[i])
      //     }
      //   }
      //   return next
      // })
    }
  }

  function handleEditInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date_of_issuance = formatDateValue(entry.date_of_issuance)
    entry.date_sent_out = formatDateValue(entry.date_sent_out)
    entry.amount = formatNumberValue(entry.amount)

    const file_fields = Object.keys(entry).filter(
      (key) => key.startsWith('file_') && !key.startsWith('file_type'),
    )

    const files = []
    for (let i = 0; i < file_fields.length; i++) {
      files.push({ file: entry[`file_${i}`], type: entry[`file_type_${i}`] })
      delete entry[`file_${i}`]
      delete entry[`file_type_${i}`]
    }
    entry.files = files

    const next = [...memoResults]
    next[editIdx] = entry

    // setTableData(next)
    setEditIdx(null)
    console.log('Edit invoice', entry)
  }

  function handleSearchInput(evt) {
    setParams({ search: evt.target.value })
  }

  function handleSort(column) {
    const property = COLUMNS[column].field
    const newDirection = column === sortOn ? -sortDirection : 1
    setSortDirection(newDirection)
    setSortOn(column)
    setPagination({ ...pagination, page: 1 })
    setParams({
      offset: 0,
      ordering: newDirection < 0 ? `-${property}` : property,
    })
  }

  function handleCountryFilter(evt) {
    const country_id = evt.target.value
    setParams({ country_id })
  }

  function handlePeriodFilter(evt) {
    const period = evt.target.value
    const replenishment_start = period.split('-')[0]
    setParams({ replenishment_start })
  }

  return (
    <>
      {showAdd ? (
        <AddInvoiceDialog
          columns={COLUMNS}
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
              defaultValue=""
              placeholder="Search invoice..."
              type="text"
              onChange={handleSearchInput}
            />
          </div>
          <Select
            id="country"
            className="placeholder-select w-52"
            onChange={handleCountryFilter}
            hasClear
            required
          >
            <option value="" disabled hidden>
              Country
            </option>
            {ctx.countries.map((c) => (
              <option key={c.iso3} className="text-primary" value={c.id}>
                {c.name_alt}
              </option>
            ))}
          </Select>
          <Select
            id="period"
            className="placeholder-select w-44"
            onChange={handlePeriodFilter}
            hasClear
            required
          >
            <option value="" disabled hidden>
              Period
            </option>
            {MOCK_PERIODS.map((period) => (
              <option key={period} className="text-primary" value={period}>
                {period}
              </option>
            ))}
          </Select>
        </div>
        <AddButton onClick={() => setShowAdd(true)}>Add invoice</AddButton>
      </div>
      <Table
        columns={columns}
        enableEdit={true}
        enableSort={true}
        rowData={memoResults}
        sortDirection={sortDirection}
        sortOn={sortOn}
        sortableColumns={COLUMNS.reduce((acc, col, idx) => {
          if (col.sortable) {
            acc.push(idx)
          }
          return acc
        }, [])}
        onDelete={handleDeleteInvoice}
        onEdit={showEditInvoiceDialog}
        onSort={handleSort}
      />
      {!!pages && pages > 1 && (
        <div className="mt-6 flex items-center justify-start print:hidden">
          <Pagination
            count={pages}
            page={pagination.page}
            siblingCount={1}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
              setParams({
                limit: pagination.rowsPerPage,
                offset: ((page || 1) - 1) * pagination.rowsPerPage,
              })
            }}
          />
        </div>
      )}
    </>
  )
}

export default InvoicesView

// Add debounce to search input
