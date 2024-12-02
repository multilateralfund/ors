'use client'

import { ApiReplenishmentPayment } from '@ors/types/api_replenishment_payments'

import React, { ChangeEvent, useContext, useMemo, useState } from 'react'

import cx from 'classnames'
import Cookies from 'js-cookie'
import { isNumber, times } from 'lodash'
import { Link } from 'wouter'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import PaymentDialog from '@ors/components/manage/Blocks/Replenishment/Payments/PaymentDialog'
import useGetPayments, {
  _PER_PAGE,
} from '@ors/components/manage/Blocks/Replenishment/Payments/useGetPayments'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import ViewFiles from '@ors/components/manage/Blocks/Replenishment/ViewFiles'
import {
  fetchWithHandling,
  formatDateForDisplay,
  formatNumberValue,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

import { SortDirection } from '../Table/types'
import {
  FormattedPayment,
  IPaymentDialogProps,
  ParsedPayment,
  PaymentColumn,
  PaymentDataFields,
  PaymentForSubmit,
} from './types'

import { IoSearchSharp } from 'react-icons/io5'

const COLUMNS: PaymentColumn[] = [
  { field: 'invoice_number', label: 'Invoice Number' },
  { field: 'country', label: 'Country', sortable: true },
  { field: 'date', label: 'Date', sortable: true },
  { field: 'amount_assessed', label: 'Amount', sortable: true },
  { field: 'currency', label: 'Currency' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
  },
  { field: 'payment_years', label: 'Year' },
  { field: 'ferm_gain_or_loss', label: 'Exchange (Gain)/Loss' },
  { field: 'files', label: 'Files' },
  { field: 'comment', label: 'Comments' },
]

const COLUMNS_AS_NAMES: Record<string, PaymentColumn> = (function () {
  const result: Record<string, PaymentColumn> = {}
  for (let i = 0; i < COLUMNS.length; i++) {
    result[COLUMNS[i].field] = COLUMNS[i]
  }
  return result
})()

const AddPaymentDialogue = function AddPaymentDialogue(
  props: Omit<IPaymentDialogProps, 'title'>,
) {
  return <PaymentDialog title="Add payment" {...props} />
}

const EditPaymentDialogue = function EditPaymentDialogue(
  props: Omit<IPaymentDialogProps, 'isEdit' | 'title'>,
) {
  return <PaymentDialog title="Edit payment" isEdit {...props} />
}

function parsePayment(entry: ApiReplenishmentPayment): ParsedPayment {
  return {
    id: entry.id,
    amount_assessed: formatNumberValue(entry.amount_assessed),
    amount_local_currency: formatNumberValue(entry.amount_local_currency),
    amount_received: formatNumberValue(entry.amount_received),
    be_amount_assessed: entry.amount_assessed,
    be_amount_local_currency: entry.amount_local_currency,
    be_amount_received: entry.amount_received,
    be_exchange_rate: entry.exchange_rate,
    be_ferm: entry.ferm_gain_or_loss,
    comment: entry.comment,
    country: entry.country.name,
    country_id: entry.country.id,
    currency: entry.currency,
    date: entry.date,
    exchange_rate: formatNumberValue(entry.exchange_rate) || 'N/A',
    ferm_gain_or_loss: formatNumberValue(entry.ferm_gain_or_loss) || 'N/A',
    files: <ViewFiles files={entry.payment_files} />,
    files_data: entry.payment_files,
    invoice: entry.invoice,
    invoice_number: entry.invoice ? entry.invoice.number : '',
    iso3: entry.country.iso3,
    payment_for_years: entry.payment_for_years,
    payment_years: entry.payment_for_years.join(', '),
    status: entry.status,
  }
}

function prepareFormDataForSubmit(formData: FormData): FormData {
  const entry = Object.fromEntries(formData.entries()) as PaymentForSubmit
  entry.exchange_rate = isNaN(entry.exchange_rate as number)
    ? ''
    : entry.exchange_rate
  entry.ferm_gain_or_loss = isNaN(entry.ferm_gain_or_loss as number)
    ? ''
    : entry.ferm_gain_or_loss
  entry.comment = entry.comment || ''
  const payment_for_years = formData.getAll('payment_for_years') as string[]
  if (payment_for_years.length > 0) {
    entry.payment_for_years = payment_for_years
  }

  if (entry?.is_ferm) {
    entry.is_ferm = 'true'
  } else {
    entry.is_ferm = 'false'
  }

  let nr_new_files = 0
  const data = new FormData()

  for (const key in entry) {
    const value = entry[key]

    // Append non-file fields if they are not null, undefined, or empty string
    if (!key.startsWith('file_')) {
      const valueIsNotAFile = value as unknown as
        | boolean
        | null
        | string
        | string[]
        | undefined
      if (
        valueIsNotAFile !== null &&
        typeof valueIsNotAFile === 'object' &&
        valueIsNotAFile.length
      ) {
        for (let i = 0; i < valueIsNotAFile.length; i++) {
          data.append(key, valueIsNotAFile[i])
        }
      } else if (
        valueIsNotAFile !== null &&
        valueIsNotAFile !== undefined &&
        valueIsNotAFile !== ''
      ) {
        data.append(key, valueIsNotAFile as string)
      }
    }
    if (key.startsWith('file_') && entry[key] instanceof File) {
      const fileIndex = key.split('_')[1]
      data.append(`files[${fileIndex}][file]`, entry[key], entry[key].name)
      nr_new_files++
    }
  }

  data.append('nr_new_files', nr_new_files.toString())
  return data
}

async function apiRequest(url: string, method: string, data: any) {
  const csrftoken = Cookies.get('csrftoken')
  await fetchWithHandling(
    formatApiUrl(url),
    {
      body: data,
      method,
    },
    csrftoken,
  )
}

async function handleErrors(error: any) {
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

function PaymentsView() {
  const ctx = useContext(ReplenishmentContext)

  const { count, loaded, results, setParams } = useGetPayments()
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: _PER_PAGE,
  })
  const memoResults: ({ id: number; isSkeleton: true } | ParsedPayment)[] =
    useMemo(() => {
      if (!loaded) {
        return times(pagination.rowsPerPage, (num) => {
          return {
            id: num + 1,
            isSkeleton: true,
          }
        })
      }
      return [...results.map(parsePayment)]
    }, [results, loaded, pagination.rowsPerPage])

  const formattedTableRows = useMemo(() => {
    if (!loaded) {
      return memoResults
    }

    const result: FormattedPayment[] = []
    for (let i = 0; i < memoResults.length; i++) {
      result.push({ ...(memoResults[i] as ParsedPayment) })
      const entry = result[i]
      entry.date = formatDateForDisplay(entry.date)

      const isNegative = entry.ferm_gain_or_loss.toString()[0] === "-"
      const value = isNegative
        ? entry.ferm_gain_or_loss.toString().substring(1)
        : entry.ferm_gain_or_loss
      entry.ferm_gain_or_loss = (
        <span>
          {isNegative ? `(${value})` : value}
        </span>
      )
    }
    return result
  }, [loaded, memoResults])

  const pages = Math.ceil(count / pagination.rowsPerPage)

  const columns: PaymentColumn<React.JSX.Element>[] = useMemo(function () {
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

  const [sortOn, setSortOn] = useState(1)
  const [sortDirection, setSortDirection] = useState<SortDirection>(-1)

  const [editIdx, setEditIdx] = useState<null | number>(null)
  const [showAdd, setShowAdd] = useState(false)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...memoResults[editIdx] } as PaymentDataFields
      entry.amount_assessed = entry.be_amount_assessed
      entry.amount_received = entry.be_amount_received
      entry.amount_local_currency = entry.be_amount_local_currency
      entry.exchange_rate = entry.be_exchange_rate
      entry.ferm_gain_or_loss = entry.be_ferm ?? ''
    }
    return entry
  }, [editIdx, memoResults])

  function showEditPaymentDialogue(idx: number) {
    setEditIdx(idx)
  }

  async function handleEditPaymentSubmit(formData: FormData) {
    const data = prepareFormDataForSubmit(formData)

    try {
      await apiRequest(
        `api/replenishment/payments/${data.get('id')}/`,
        'PUT',
        data,
      )
      enqueueSnackbar('Payment updated successfully.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
      setShowAdd(false)
    } catch (error) {
      setShowAdd(false)
      await handleErrors(error)
    }

    setEditIdx(null)
  }

  async function handleAddPaymentSubmit(formData: FormData) {
    const data = prepareFormDataForSubmit(formData)

    try {
      await apiRequest('api/replenishment/payments/', 'POST', data)
      enqueueSnackbar('Payment updated successfully.', { variant: 'success' })
      setParams({
        offset: 0,
      })
      setPagination({ ...pagination, page: 1 })
      setShowAdd(false)
    } catch (error) {
      setShowAdd(false)
      await handleErrors(error)
    }
  }

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<null | number>(null)

  function promptDeletePayment(rowId: number) {
    setPaymentToDelete(rowId)
    setIsDeleteModalVisible(true)
  }

  async function handleDeletePayment(rowId: number) {
    setPaymentToDelete(null)
    const entry = { ...memoResults[rowId] }

    try {
      await apiRequest(
        `api/replenishment/payments/${entry.id}/`,
        'DELETE',
        null,
      )
      enqueueSnackbar('Payment deleted.', { variant: 'success' })
      setParams({
        offset: ((pagination.page || 1) - 1) * pagination.rowsPerPage,
      })
    } catch (error) {
      await handleErrors(error)
    }
  }

  function handleSort(column: number) {
    const property = COLUMNS[column].field
    const newDirection = (
      column === sortOn ? -sortDirection : 1
    ) as SortDirection
    setSortDirection(newDirection)
    setSortOn(column)
    setPagination({ ...pagination, page: 1 })
    setParams({
      offset: 0,
      ordering: newDirection < 0 ? `-${property}` : property,
    })
  }

  function handleCountryFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const country_id = evt.target.value
    setParams({ country_id })
  }

  function handleSearchInput(evt: ChangeEvent<HTMLInputElement>) {
    setParams({ search: evt.target.value })
  }

  function handleYearFilter(evt: ChangeEvent<HTMLSelectElement>) {
    setParams({ year: evt.target.value })
  }
  const yearOptions = scAnnualOptions(ctx.periods)

  const ViewPicker = () => {
    return (
      <div className="mb-2 flex items-center gap-4 print:fixed print:left-[480px] print:top-12">
        <Link
          className="m-0 text-2xl uppercase text-primary no-underline print:hidden"
          href="/invoices"
        >
          Invoices
        </Link>
        <span className="print:hidden"> | </span>
        <h2 className="m-0 text-3xl uppercase">Payments</h2>
      </div>
    )
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
          columns={COLUMNS_AS_NAMES}
          countries={ctx.countriesSOA}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddPaymentSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditPaymentDialogue
          columns={COLUMNS_AS_NAMES}
          countries={ctx.countriesSOA}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditPaymentSubmit}
        />
      ) : null}
      <ViewPicker />
      <div className="flex items-center justify-between gap-4 pb-4 print:hidden">
        <div className="flex items-center gap-x-4">
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
          <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
          {!ctx.isCountryUser && (
            <Select
              id="country"
              className="placeholder-select !ml-0 w-52"
              onChange={handleCountryFilter}
              onClear={() => setParams({ country_id: '' })}
              hasClear
              required
            >
              <option value="" disabled hidden>
                Country
              </option>
              {ctx.countriesSOA.map((c) => (
                <option key={c.iso3} className="text-primary" value={c.id}>
                  {c.name_alt}
                </option>
              ))}
            </Select>
          )}
          <Select
            id="year"
            className="placeholder-select w-44"
            onChange={handleYearFilter}
            onClear={() => setParams({ year: '' })}
            hasClear
          >
            <option value="" disabled hidden>
              Year
            </option>
            {yearOptions.map((year) => (
              <option
                key={year.value}
                className="text-primary"
                value={year.value}
              >
                {year.label}
              </option>
            ))}
          </Select>
        </div>
        {ctx.isTreasurer && (
          <AddButton onClick={() => setShowAdd(true)}>Add payment</AddButton>
        )}
      </div>
      <Table
        adminButtons={ctx.isTreasurer}
        columns={columns}
        enableSort={true}
        rowData={formattedTableRows}
        sortDirection={sortDirection}
        sortOn={sortOn}
        sortableColumns={COLUMNS.reduce<number[]>((acc, col, idx) => {
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
