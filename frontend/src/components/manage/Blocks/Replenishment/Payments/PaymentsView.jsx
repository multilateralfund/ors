'use client'

import React, { useContext, useMemo, useState } from 'react'

import Cookies from 'js-cookie'
import { times } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import PaymentDialoge from '@ors/components/manage/Blocks/Replenishment/Payments/PaymentDialogue'
import useGetPayments, {
  _PER_PAGE,
} from '@ors/components/manage/Blocks/Replenishment/Payments/useGetPayments'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import {
  dateForEditField,
  dateForInput,
  formatDateValue,
  formatNumberValue,
  numberForEditField,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'
import api from '@ors/helpers/Api/_api'

import { IoSearchSharp } from 'react-icons/io5'
import ViewFiles from '@ors/components/manage/Blocks/Replenishment/ViewFiles'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date', sortable: true },
  { field: 'amount', label: 'Amount', sortable: true },
  { field: 'currency', label: 'Currency' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
  },
  { field: 'payment_for_year', label: 'Year(s)' },
  { field: 'gain_or_loss', label: 'FERM Gain/Loss' },
  { field: 'files', label: 'Files' },
  { field: 'comments', label: 'Comments' },
]

const AddInvoiceDialog = function AddInvoiceDialog(props) {
  return <PaymentDialoge title="Add payment" {...props} />
}

const EditInvoiceDialog = function EditInvoiceDialog(props) {
  return <PaymentDialoge title="Edit payment" isEdit {...props} />
}

function PaymentsView() {
  const ctx = useContext(ReplenishmentContext)

  const { count, loaded, results, setParams } = useGetPayments()
  const [_, setError] = useState(null)
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
        amount: formatNumberValue(data.amount_local_currency),
        comments: data.comments,
        country: data.country.name,
        country_id: data.country.id,
        date: formatDateValue(data.date),
        // currency: data.currency,
        // exchange_rate: data.exchange_rate.toFixed(3),
        files: <ViewFiles files={data.payment_files} />,
        files_data: data.payment_files,
        gain_or_loss: data.gain_or_loss,
        iso3: data.country.iso3,
        payment_for_year: data.payment_for_year,
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
      entry.reminder_date = dateForEditField(entry.reminder_date)
      entry.amount = numberForEditField(entry.amount)
      // entry.gain_or_loss = numberForEditField(entry.gain_or_loss)
    }
    return entry
  }, [editIdx, memoResults])

  function showEditPaymentDialogue(idx) {
    setEditIdx(idx)
  }

  async function handleEditPaymentSubmit(formData) {
    const entry = { ...formData }
    entry.reminder_date = dateForInput(entry.reminder_date)

    const data = new FormData()
    for (const key in entry) {
      if (!key.startsWith('file_')) {
        data.append(key, entry[key])
      }
    }
    // let nr_of_files = 0
    // // Append files with their types [payment, reminder]
    // for (const key in entry) {
    //   if (key.startsWith('file_') && entry[key] instanceof File) {
    //     const fileIndex = key.split('_')[1]
    //     const fileTypeKey = `file_type_${fileIndex}`
    //     if (entry[fileTypeKey]) {
    //       nr_of_files++
    //       data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
    //       data.append(`files[${fileIndex}][type]`, entry[fileTypeKey])
    //     }
    //   }
    // }
    //
    // data.append('nr_of_files', nr_of_files)

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetch(formatApiUrl(`api/replenishment/payments/${entry.id}/`), {
        body: data,
        credentials: 'include',
        headers: {
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
        },
        method: 'PUT',
      })
      enqueueSnackbar('Invoice updated successfully.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
      setShowAdd(false)
    } catch (error) {
      setShowAdd(false)
      if (error.status === 400) {
        const errors = await error.json()
        setError({ ...errors })
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
        setError({})
      }
    }

    setEditIdx(null)
  }

  async function handleAddPaymentSubmit(formData) {
    console.log('formData', formData)
    const entry = { ...formData }
    entry.reminder_date = dateForInput(entry.reminder_date)

    const data = new FormData()
    for (const key in entry) {
      if (!key.startsWith('file_')) {
        data.append(key, entry[key])
      }
    }

    // let nr_of_files = 0
    // // Append files with their types [payment, reminder]
    // for (const key in entry) {
    //   if (key.startsWith('file_') && entry[key] instanceof File) {
    //     const fileIndex = key.split('_')[1]
    //     const fileTypeKey = `file_type_${fileIndex}`
    //     if (entry[fileTypeKey]) {
    //       nr_of_files++
    //       data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
    //       data.append(`files[${fileIndex}][type]`, entry[fileTypeKey])
    //     }
    //   }
    // }
    //
    // data.append('nr_of_files', nr_of_files)

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetch(formatApiUrl('api/replenishment/payments/'), {
        body: data,
        credentials: 'include',
        headers: {
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
        },
        method: 'POST',
      })
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
        setError({ ...errors })
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
        setError({})
      }
    }
  }

  async function handleDeletePayment(rowId) {
    const confirmed = confirm('Are you sure you want to delete this payment?')
    if (!confirmed) return

    const entry = { ...memoResults[rowId] }

    try {
      await api(`api/replenishment/payments/${entry.id}/`, {
        data: entry,
        method: 'DELETE',
      })
      enqueueSnackbar('Invoice deleted.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        setError({ ...errors })
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
        setError({})
      }
    }
  }

  function handleSearchInput(evt) {
    // setParams({ search: evt.target.value })
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
          onSubmit={handleAddPaymentSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditInvoiceDialog
          columns={COLUMNS}
          countries={ctx.countries}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditPaymentSubmit}
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
              placeholder="Search payment..."
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
        <AddButton onClick={() => setShowAdd(true)}>Add payment</AddButton>
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
        onDelete={handleDeletePayment}
        onEdit={showEditPaymentDialogue}
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

export default PaymentsView
