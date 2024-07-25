'use client'

import React, { useContext, useMemo, useState } from 'react'

import Cookies from 'js-cookie'
import { times } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import { Select } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import PaymentDialog from '@ors/components/manage/Blocks/Replenishment/Payments/PaymentDialog'
import useGetPayments, {
  _PER_PAGE,
} from '@ors/components/manage/Blocks/Replenishment/Payments/useGetPayments'
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
  { field: 'ferm_gain_or_loss', label: 'FERM Gain/Loss' },
  { field: 'files', label: 'Files' },
  { field: 'comment', label: 'Comments' },
]

const AddPaymentDialogue = function AddPaymentDialogue(props) {
  return <PaymentDialog title="Add payment" {...props} />
}

const EditPaymentDialogue = function EditPaymentDialogue(props) {
  return <PaymentDialog title="Edit payment" isEdit {...props} />
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
        amount: formatNumberValue(data.amount),
        be_amount: data.amount,
        be_exchange_rate: data.exchange_rate,
        be_ferm: data.ferm_gain_or_loss,
        comment: data.comment,
        country: data.country.name,
        country_id: data.country.id,
        currency: data.currency,
        date: formatDateValue(data.date),
        exchange_rate: formatNumberValue(data.exchange_rate) || 'N/A',
        ferm_gain_or_loss: formatNumberValue(data.ferm_gain_or_loss) || 'N/A',
        files: <ViewFiles files={data.payment_files} />,
        files_data: data.payment_files,
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
      entry.date = dateForEditField(entry.date)
      entry.amount = entry.be_amount
      entry.exchange_rate = entry.be_exchange_rate
      entry.ferm_gain_or_loss = entry.be_ferm
    }
    return entry
  }, [editIdx, memoResults])

  function showEditPaymentDialogue(idx) {
    setEditIdx(idx)
  }

  async function handleEditPaymentSubmit(formData) {
    const entry = { ...formData }
    entry.date = dateForInput(entry.date)
    entry.exchange_rate = isNaN(entry.exchange_rate) ? '' : entry.exchange_rate
    entry.ferm_gain_or_loss = isNaN(entry.ferm_gain_or_loss)
      ? ''
      : entry.ferm_gain_or_loss
    entry.comment = entry.comment || ''

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
      if (key.startsWith('file_') && entry[key] instanceof File) {
        const fileIndex = key.split('_')[1]
        data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
        nr_new_files++
      }
    }

    data.append('nr_new_files', nr_new_files)

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetchWithHandling(
        formatApiUrl(`api/replenishment/payments/${entry.id}/`),
        {
          body: data,
          method: 'PUT',
        },
        csrftoken,
      )
      enqueueSnackbar('Payment updated successfully.', { variant: 'success' })
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
    const entry = { ...formData }
    entry.date = dateForInput(entry.date)
    entry.exchange_rate = isNaN(entry.exchange_rate) ? '' : entry.exchange_rate
    entry.ferm_gain_or_loss = isNaN(entry.ferm_gain_or_loss)
      ? ''
      : entry.ferm_gain_or_loss
    entry.comment = entry.comment || ''

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
        data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
        nr_new_files++
      }
    }

    data.append('nr_new_files', nr_new_files)

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetchWithHandling(
        formatApiUrl('api/replenishment/payments/'),
        {
          body: data,
          method: 'POST',
        },
        csrftoken,
      )
      enqueueSnackbar('Payment updated successfully.', { variant: 'success' })
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

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)

  function promptDeletePayment(rowId) {
    setPaymentToDelete(rowId)
    setIsDeleteModalVisible(true)
  }

  async function handleDeletePayment(rowId) {
    setPaymentToDelete(null)
    const entry = { ...memoResults[rowId] }

    try {
      const csrftoken = Cookies.get('csrftoken')
      await fetchWithHandling(
        formatApiUrl(`api/replenishment/payments/${entry.id}/`),
        {
          method: 'DELETE',
        },
        csrftoken,
      )
      enqueueSnackbar('Payment deleted.', { variant: 'success' })
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

  return (
    <>
      {isDeleteModalVisible && paymentToDelete !== null ? (
        <ConfirmDialog
          onCancel={() => {
            setIsDeleteModalVisible(false)
            setPaymentToDelete(null)
          }}
          onSubmit={() => handleDeletePayment(paymentToDelete)}
        >
          <div className="text-lg">
            Are you sure you want to delete this payment ?
          </div>
        </ConfirmDialog>
      ) : null}
      {showAdd ? (
        <AddPaymentDialogue
          columns={COLUMNS}
          countries={ctx.countries}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddPaymentSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditPaymentDialogue
          columns={COLUMNS}
          countries={ctx.countries}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditPaymentSubmit}
        />
      ) : null}
      <div className="flex items-center justify-between gap-4 pb-4 print:hidden">
        <div className="flex items-center">
          {!ctx.isCountryUser && (
            <Select
              id="country"
              className="placeholder-select !ml-0 w-52"
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
          )}
        </div>
        {ctx.isTreasurer && (
          <AddButton onClick={() => setShowAdd(true)}>Add payment</AddButton>
        )}
      </div>
      <Table
        adminButtons={ctx.isTreasurer}
        columns={columns}
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
