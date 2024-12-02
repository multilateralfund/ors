'use client'

import { ChangeEvent, useContext, useMemo, useState } from 'react'

import Cookies from 'js-cookie'
import { times } from 'lodash'
import { Link } from 'wouter'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import {
  Input,
  Select,
  YearRangeInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceDialog from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceDialog'
import InvoiceStatus from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceStatus'
import useGetInvoices from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import ViewFiles from '@ors/components/manage/Blocks/Replenishment/ViewFiles'
import {
  fetchWithHandling,
  formatDateForDisplay,
  formatNumberValue,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

import { SortDirection } from '../Table/types'
import {
  InvoiceColumn,
  InvoiceDialogProps,
  InvoiceForSubmit,
  ParsedInvoice,
} from './types'

import { IoSearchSharp } from 'react-icons/io5'

const COLUMNS: InvoiceColumn[] = [
  { field: 'number', label: 'Invoice Number' },
  { field: 'country', label: 'Country', sortable: true },
  { field: 'status', label: 'Status' },
  { field: 'year', label: 'Year' },
  { field: 'date_of_issuance', label: 'Date of Issuance', sortable: true },
  { field: 'amount', label: 'Amount' },
  { field: 'currency', label: 'Currency' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
    subLabel: '(FERM)',
  },
  { field: 'date_sent_out', label: 'Sent on' },
  {
    field: 'date_first_reminder',
    label: 'First Reminder',
    subLabel: '(sent on)',
  },
  {
    field: 'date_second_reminder',
    label: 'Second Reminder',
    subLabel: '(sent on)',
  },
  { field: 'files', label: 'Files' },
]

const AddInvoiceDialog = function AddInvoiceDialog(
  props: Omit<InvoiceDialogProps, 'title'>,
) {
  return <InvoiceDialog title="Add invoice" {...props} />
}

const EditInvoiceDialog = function EditInvoiceDialog(
  props: Omit<InvoiceDialogProps, 'isEdit' | 'title'>,
) {
  return <InvoiceDialog title="Edit invoice" isEdit {...props} />
}

function InvoicesView() {
  const currentYear = new Date().getFullYear()
  const ctx = useContext(ReplenishmentContext)

  const { loaded, params, results, setParams } = useGetInvoices({
    year_max: currentYear,
    year_min: currentYear,
  })
  const memoResults: ({ id: number; isSkeleton: true } | ParsedInvoice)[] =
    useMemo(() => {
      if (!loaded) {
        return times(10, (num) => {
          return {
            id: num + 1,
            isSkeleton: true,
          }
        })
      }
      return results.map(
        (data): ParsedInvoice => ({
          id: data.id,
          get amount() {
            return this.is_ferm ? this.amount_local_currency : this.amount_usd
          },
          amount_local_currency: formatNumberValue(data.amount_local_currency),
          amount_usd: formatNumberValue(data.amount_usd),
          be_amount_local_currency: data.amount_local_currency,
          be_amount_usd: data.amount_usd,
          be_exchange_rate: data.exchange_rate,
          can_delete: !!(ctx.isTreasurer && data.id),
          can_edit: !!(ctx.isTreasurer && data.id),
          country: data.country.name,
          country_id: data.country.id,
          currency: data.currency,
          date_first_reminder: data.date_first_reminder,
          date_of_issuance: data.date_of_issuance,
          date_second_reminder: data.date_second_reminder,
          date_sent_out: data.date_sent_out,
          exchange_rate: data.is_ferm
            ? formatNumberValue(data.exchange_rate)
            : null,
          files: <ViewFiles files={data.invoice_files} />,
          files_data: data.invoice_files,
          gray: !data.id,
          is_ferm: data.is_ferm || false,
          iso3: data.country.iso3,
          number: data.number?.toLocaleString(),
          status: <InvoiceStatus row={data} />,
          year: data.year || '-',
        }),
      )
    }, [loaded, results, ctx.isTreasurer])

  const formattedTableRows = useMemo(() => {
    if (!loaded) {
      return memoResults
    }

    const result: ParsedInvoice[] = []
    for (let i = 0; i < memoResults.length; i++) {
      result.push({ ...(memoResults[i] as ParsedInvoice) })
      const entry = result[i]
      entry.date_first_reminder = formatDateForDisplay(
        entry.date_first_reminder,
      )
      entry.date_of_issuance = formatDateForDisplay(entry.date_of_issuance)
      entry.date_second_reminder = formatDateForDisplay(
        entry.date_second_reminder,
      )
      entry.date_sent_out = formatDateForDisplay(entry.date_sent_out)
      entry.exchange_rate = entry.exchange_rate || '-'
    }
    return result
  }, [loaded, memoResults])

  const columns: InvoiceColumn[] = useMemo(function () {
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

  const [sortOn, setSortOn] = useState(4)
  const [sortDirection, setSortDirection] = useState<SortDirection>(-1)

  const [editIdx, setEditIdx] = useState<null | number>(null)
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [hideNoInvoice, setHideNoInvoice] = useState(true)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...memoResults[editIdx] } as ParsedInvoice
      entry.amount_local_currency = entry.be_amount_local_currency
      entry.amount_usd = entry.be_amount_usd
      entry.exchange_rate = entry.be_exchange_rate
    }
    return entry
  }, [editIdx, memoResults])

  function showEditInvoiceDialog(idx: number) {
    setEditIdx(idx)
  }

  async function handleEditInvoiceSubmit(formData: FormData) {
    const entry = Object.fromEntries(formData.entries()) as InvoiceForSubmit
    entry.date_of_issuance = entry.date_of_issuance || ''
    entry.date_sent_out = entry.date_sent_out || ''
    entry.date_first_reminder = entry.date_first_reminder || ''
    entry.date_second_reminder = entry.date_second_reminder || ''
    entry.exchange_rate = isNaN(entry.exchange_rate as number)
      ? ''
      : entry.exchange_rate

    if (entry.is_ferm === 'false') {
      entry.currency = 'USD'
    }

    let nr_new_files = 0
    const data = new FormData()

    for (const key in entry) {
      const value = entry[key]

      // Append non-file fields if they are not null, undefined, or empty string
      if (!key.startsWith('file_')) {
        const valueIsNotAFile = value as unknown as null | string | undefined
        if (
          valueIsNotAFile !== null &&
          valueIsNotAFile !== undefined &&
          valueIsNotAFile !== ''
        ) {
          data.append(key, valueIsNotAFile)
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

    data.append('nr_new_files', nr_new_files.toString())

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
        cache_bust: crypto.randomUUID(),
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

  async function handleAddInvoiceSubmit(formData: FormData) {
    const entry = Object.fromEntries(formData.entries()) as InvoiceForSubmit
    entry.exchange_rate = isNaN(entry.exchange_rate as number)
      ? ''
      : entry.exchange_rate

    if (entry.is_ferm === 'false') {
      entry.currency = 'USD'
    }

    let nr_new_files = 0
    const data = new FormData()

    for (const key in entry) {
      const value = entry[key as keyof InvoiceForSubmit]

      // Append non-file fields if they are not null, undefined, or empty string
      if (!key.startsWith('file_')) {
        const valueIsNotAFile = value as unknown as null | string | undefined
        if (
          valueIsNotAFile !== null &&
          valueIsNotAFile !== undefined &&
          valueIsNotAFile !== ''
        ) {
          data.append(key, valueIsNotAFile)
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

    data.append('nr_new_files', nr_new_files.toString())

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

      enqueueSnackbar('Invoice added successfully.', { variant: 'success' })
      setParams({
        cache_bust: crypto.randomUUID(),
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
  }

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<null | number>(null)

  function promptDeletePayment(rowId: number) {
    setInvoiceToDelete(rowId)
    setIsDeleteModalVisible(true)
  }

  async function handleDeleteInvoice(rowId: number) {
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
        cache_bust: crypto.randomUUID(),
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

  function handleSearchInput(evt: ChangeEvent<HTMLInputElement>) {
    setParams({ search: evt.target.value })
  }

  function handleSort(column: number) {
    const property = COLUMNS[column].field
    const newDirection = (
      column === sortOn ? -sortDirection : 1
    ) as SortDirection
    setSortDirection(newDirection)
    setSortOn(column)
    setParams({
      ordering: newDirection < 0 ? `-${property}` : property,
    })
  }

  function handleCountryFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const country_id = evt.target.value
    setParams({ country_id })
  }

  function handleYearRangeFilter(value: number[]) {
    setParams({ year_max: value[1], year_min: value[0] })
  }

  const yearOptions = scAnnualOptions(ctx.periods)
  const yearRange = {
    max: parseInt(yearOptions[0].value, 10),
    min: parseInt(yearOptions[yearOptions.length - 1].value, 10),
    get value() {
      if (params?.year_min && params?.year_max) {
        return [params.year_min, params.year_max]
      }
      return []
    },
  }

  function handleStatusFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const status = evt.target.value
    setParams({ status })
  }

  function handleRemindersFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const reminders_sent = evt.target.value
    setParams({ reminders_sent })
  }

  function handleFERMFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const opted_for_ferm = evt.target.value
    setParams({ opted_for_ferm })
  }

  function handleChangeHideNoInvoice(evt: ChangeEvent<HTMLInputElement>) {
    setHideNoInvoice(evt.target.checked)
    setParams({ hide_no_invoice: evt.target.checked })
  }

  const ViewPicker = () => {
    return (
      <div className="mb-2 flex items-center gap-4 print:fixed print:left-[480px] print:top-12">
        <h2 className="m-0 text-3xl uppercase">Invoices</h2>
        <span className="print:hidden"> | </span>
        <Link
          className="m-0 text-2xl uppercase text-primary no-underline print:hidden"
          href="/payments"
        >
          Payments
        </Link>
      </div>
    )
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
          countries={ctx.countriesSOA}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddInvoiceSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditInvoiceDialog
          countries={ctx.countriesSOA}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditInvoiceSubmit}
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
              placeholder="Search invoice..."
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
          <YearRangeInput
            max={yearRange.max}
            min={yearRange.min}
            value={yearRange.value}
            onChange={handleYearRangeFilter}
          />
          <Select
            id="status"
            className="placeholder-select ml-0 w-44"
            onChange={handleStatusFilter}
            onClear={() => setParams({ status: '' })}
            hasClear
          >
            <option value="" disabled hidden>
              Status
            </option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially paid</option>
            <option value="pending">Pending</option>
            <option value="not_issued">Not issued</option>
          </Select>
          <Select
            id="reminders_sent"
            className="placeholder-select ml-0 w-44"
            onChange={handleRemindersFilter}
            onClear={() => setParams({ reminders_sent: '' })}
            hasClear
          >
            <option value="" disabled hidden>
              Reminders sent
            </option>
            <option value="0">None</option>
            <option value="1">One</option>
            <option value="2">Two</option>
          </Select>
          <Select
            id="opted_for_ferm"
            className="placeholder-select ml-0 w-44"
            onChange={handleFERMFilter}
            onClear={() => setParams({ opted_for_ferm: '' })}
            hasClear
          >
            <option value="" disabled hidden>
              Opted for FERM
            </option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </Select>
        </div>
        {ctx.isTreasurer && (
          <div className="flex items-center gap-x-2">
            <Input
              id="hide_no_invoice"
              checked={hideNoInvoice}
              type="checkbox"
              onChange={handleChangeHideNoInvoice}
            />
            <label htmlFor="hide_no_invoice">
              Hide countries without invoice
            </label>
            <AddButton onClick={() => setShowAdd(true)}>Add invoice</AddButton>
          </div>
        )}
      </div>
      <Table
        adminButtons={false}
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
        onEdit={showEditInvoiceDialog}
        onSort={handleSort}
      />
    </>
  )
}

export default InvoicesView
