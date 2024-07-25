'use client'

import React, { useContext, useMemo, useState } from 'react'

import Cookies from 'js-cookie'
import { times } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceDialog from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceDialog'
import useGetInvoices, {
  _PER_PAGE,
} from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import ViewFiles from '@ors/components/manage/Blocks/Replenishment/ViewFiles'
import {
  dateForEditField,
  dateForInput,
  fetchWithHandling,
  formatDateValue,
  formatNumberValue,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

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
        id: data.id,
        amount: formatNumberValue(data.amount),
        be_amount: data.amount,
        be_exchange_rate: data.exchange_rate,
        country: data.country.name,
        country_id: data.country.id,
        currency: data.currency,
        date_of_issuance: formatDateValue(data.date_of_issuance),
        date_sent_out: formatDateValue(data.date_sent_out) || 'N/A',
        exchange_rate: formatNumberValue(data.exchange_rate) || 'N/A',
        files: <ViewFiles files={data.invoice_files} />,
        files_data: data.invoice_files,
        iso3: data.country.iso3,
        number: data.number.toLocaleString(),
        reminder: data.reminder_sent_on || 'N/A',
        replenishment: data.replenishment,
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
      entry.amount = entry.be_amount
      entry.exchange_rate = entry.be_exchange_rate
    }
    return entry
  }, [editIdx, memoResults])

  function showEditInvoiceDialog(idx) {
    setEditIdx(idx)
  }

  async function handleEditInvoiceSubmit(formData) {
    const entry = { ...formData }
    entry.date_of_issuance = dateForInput(entry.date_of_issuance)
    entry.date_sent_out = dateForInput(entry.date_sent_out) || ''
    entry.reminder = dateForInput(entry.reminder) || ''
    entry.exchange_rate = isNaN(entry.exchange_rate) ? '' : entry.exchange_rate

    let nr_new_files = 0
    const data = new FormData()

    for (const key in entry) {
      const value = entry[key]

      // Append non-file fields if they are not null, undefined
      // Empty strings are used to delete a value
      if (!key.startsWith('file_')) {
        if (value !== null && value !== undefined) {
          data.append(key, value)
        }
      }

      // Append files with their types if they are valid
      if (key.startsWith('file_') && value instanceof File) {
        const fileIndex = key.split('_')[1]
        const fileTypeKey = `file_type_${fileIndex}`
        const fileType = entry[fileTypeKey]

        ;(fileType ?? fileType !== '') &&
          nr_new_files++ &&
          (data.append(`files[${fileIndex}][file]`, value, value.name),
          data.append(`files[${fileIndex}][type]`, fileType))
      }
    }

    data.append('nr_new_files', nr_new_files)

    try {
      const csrftoken = Cookies.get('csrftoken')

      await fetchWithHandling(
        formatApiUrl(`api/replenishment/invoices/${entry.id}/`),
        {
          body: data,
          method: 'PUT',
        },
        csrftoken,
      )
      enqueueSnackbar('Invoice updated successfully.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
      setShowAdd(false)
    } catch (error) {
      setShowAdd(false)
      if (error.status === 400) {
        const errors = await error.json()
        enqueueSnackbar(
          errors.general_error ||
            errors.files ||
            'Please make sure all the inputs are correct.',
          { variant: 'error' },
        )
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }

    setEditIdx(null)
  }

  async function handleAddInvoiceSubmit(formData) {
    const entry = { ...formData }
    entry.date_of_issuance = dateForInput(entry.date_of_issuance)
    entry.date_sent_out = dateForInput(entry.date_sent_out)
    entry.reminder = dateForInput(entry.reminder)
    entry.exchange_rate = isNaN(entry.exchange_rate) ? '' : entry.exchange_rate
    entry.replenishment_id = ctx.periods.find(
      (p) => Number(p.start_year) === Number(entry.period.split('-')[0]),
    )?.id

    let nr_new_files = 0
    const data = new FormData()

    for (const key in entry) {
      const value = entry[key]

      // Append non-file fields if they are not null, undefined, or empty string
      if (!key.startsWith('file_')) {
        if (value !== null && value !== undefined && value !== '') {
          data.append(key, value)
        }
      }
      if (key.startsWith('file_') && entry[key] instanceof File) {
        const fileIndex = key.split('_')[1]
        const fileTypeKey = `file_type_${fileIndex}`
        if (entry[fileTypeKey]) {
          nr_new_files++
          data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
          data.append(`files[${fileIndex}][type]`, entry[fileTypeKey])
        }
      }
    }

    data.append('nr_new_files', nr_new_files)

    try {
      const csrftoken = Cookies.get('csrftoken')

      await fetchWithHandling(
        formatApiUrl('api/replenishment/invoices/'),
        {
          body: data,
          method: 'POST',
        },
        csrftoken,
      )

      enqueueSnackbar('Invoice updated successfully.', { variant: 'success' })
      setParams({
        offset: 0,
      })
      setPagination({ ...pagination, page: 1 })
      setShowAdd(false)
    } catch (error) {
      setShowAdd(false)
      if (error.status === 400) {
        const errors = await error.json()
        enqueueSnackbar(
          errors.general_error ||
            errors.files ||
            'Please make sure all the inputs are correct.',
          { variant: 'error' },
        )
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }
  }

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)

  function promptDeletePayment(rowId) {
    setInvoiceToDelete(rowId)
    setIsDeleteModalVisible(true)
  }

  async function handleDeleteInvoice(rowId) {
    setInvoiceToDelete(null)
    const entry = { ...memoResults[rowId] }

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetchWithHandling(
        formatApiUrl(`api/replenishment/invoices/${entry.id}/`),
        {
          method: 'DELETE',
        },
        csrftoken,
      )
      enqueueSnackbar('Invoice deleted.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        enqueueSnackbar(
          errors.general_error ||
            errors.files ||
            'Please make sure all the inputs are correct.',
          { variant: 'error' },
        )
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }
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
      {isDeleteModalVisible && invoiceToDelete !== null ? (
        <ConfirmDialog
          onCancel={() => {
            setIsDeleteModalVisible(false)
            setInvoiceToDelete(null)
          }}
          onSubmit={() => handleDeleteInvoice(invoiceToDelete)}
        >
          <div className="text-lg">
            Are you sure you want to delete this invoice ?
          </div>
        </ConfirmDialog>
      ) : null}
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
            {ctx.periodOptions.map((period) => (
              <option
                key={period.value}
                className="text-primary"
                value={period.value}
              >
                {period.label}
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
        onDelete={promptDeletePayment}
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
