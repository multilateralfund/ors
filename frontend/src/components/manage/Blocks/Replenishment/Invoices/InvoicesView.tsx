'use client'

import { ChangeEvent, useContext, useMemo, useState } from 'react'

import Cookies from 'js-cookie'
import { times } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import {
  Input,
  Select,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import InvoiceDialog from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceDialog'
import InvoiceStatus from '@ors/components/manage/Blocks/Replenishment/Invoices/InvoiceStatus'
import useGetInvoices from '@ors/components/manage/Blocks/Replenishment/Invoices/useGetInvoices'
import { scAnnualOptions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
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
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { formatApiUrl } from '@ors/helpers'

import { SortDirection } from '../Table/types'
import { InvoiceDialogProps } from './types'
import { InvoiceColumn, InvoiceForSubmit, ParsedInvoice } from './types'

import { IoSearchSharp } from 'react-icons/io5'

const COLUMNS: InvoiceColumn[] = [
  { field: 'country', label: 'Country', sortable: true },
  { field: 'status', label: 'Status' },
  { field: 'year', label: 'Year' },
  { field: 'date_of_issuance', label: 'Date of issuance', sortable: true },
  { field: 'amount', label: 'Amount' },
  {
    field: 'exchange_rate',
    label: 'Exchange Rate',
    subLabel: '(FERM)',
  },
  { field: 'date_sent_out', label: 'Sent on' },
  {
    field: 'date_first_reminder',
    label: 'First reminder',
    subLabel: '(sent on)',
  },
  {
    field: 'date_second_reminder',
    label: 'Second reminder',
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

  const { loaded, results, setParams } = useGetInvoices(currentYear)
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
      return results.map((data) => ({
        id: data.id,
        amount:
          data.amount && data.currency
            ? formatNumberValue(data.amount) + ' ' + data.currency
            : '-',
        be_amount: data.amount,
        be_exchange_rate: data.exchange_rate,
        can_delete: !!(ctx.isTreasurer && data.id),
        can_edit: !!(ctx.isTreasurer && data.id),
        country: data.country.name,
        country_id: data.country.id,
        currency: data.currency,
        date_first_reminder: formatDateValue(data.date_first_reminder) || '-',
        date_of_issuance: formatDateValue(data.date_of_issuance),
        date_second_reminder: formatDateValue(data.date_second_reminder) || '-',
        date_sent_out: formatDateValue(data.date_sent_out) || '-',
        exchange_rate: formatNumberValue(data.exchange_rate) || '-',
        files: <ViewFiles files={data.invoice_files} />,
        files_data: data.invoice_files,
        gray: !data.id,
        iso3: data.country.iso3,
        number: data.number?.toLocaleString(),
        replenishment: data.replenishment,
        status: <InvoiceStatus row={data} />,
        year: data.year || '-',
      }))
    }, [loaded, results, ctx.isTreasurer])

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

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState<SortDirection>(1)

  const [editIdx, setEditIdx] = useState<null | number>(null)
  const [showAdd, setShowAdd] = useState<boolean>(false)
  const [hideNoInvoice, setHideNoInvoice] = useState(true)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...memoResults[editIdx] } as ParsedInvoice
      entry.date_of_issuance = dateForEditField(entry.date_of_issuance)
      entry.date_sent_out = dateForEditField(entry.date_sent_out)
      entry.date_first_reminder = dateForEditField(entry?.date_first_reminder)
      entry.date_second_reminder = dateForEditField(entry?.date_second_reminder)
      entry.amount = entry.be_amount
      entry.exchange_rate = entry.be_exchange_rate
    }
    return entry
  }, [editIdx, memoResults])

  function showEditInvoiceDialog(idx: number) {
    setEditIdx(idx)
  }

  async function handleEditInvoiceSubmit(formData: FormData) {
    const entry = Object.fromEntries(formData.entries()) as InvoiceForSubmit
    entry.date_of_issuance = dateForInput(entry.date_of_issuance)
    entry.date_sent_out = dateForInput(entry.date_sent_out) || ''
    entry.date_first_reminder = dateForInput(entry.date_first_reminder) || ''
    entry.date_second_reminder = dateForInput(entry.date_second_reminder) || ''
    entry.exchange_rate = isNaN(entry.exchange_rate as number)
      ? ''
      : entry.exchange_rate

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
    entry.date_of_issuance = dateForInput(entry.date_of_issuance)
    entry.date_sent_out = dateForInput(entry.date_sent_out)
    entry.date_first_reminder = dateForInput(entry.date_first_reminder)
    entry.date_second_reminder = dateForInput(entry.date_second_reminder)
    entry.reminder = dateForInput(entry.reminder)
    entry.exchange_rate = isNaN(entry.exchange_rate as number)
      ? ''
      : entry.exchange_rate
    entry.replenishment_id = ctx.periods.find(
      (p) =>
        Number(p.start_year) <= Number(entry.year) &&
        Number(p.end_year) >= Number(entry.year),
    )?.id

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

  function handleYearFilter(evt: ChangeEvent<HTMLSelectElement>) {
    setParams({ year: evt.target.value })
  }
  const yearOptions = scAnnualOptions(ctx.periods)

  function handleStatusFilter(evt: ChangeEvent<HTMLSelectElement>) {
    const status = evt.target.value
    setParams({ status })
  }

  function handleChangeHideNoInvoice(evt: ChangeEvent<HTMLInputElement>) {
    setHideNoInvoice(evt.target.checked)
    setParams({ hide_no_invoice: evt.target.checked })
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
          countries={ctx.countries}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddInvoiceSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditInvoiceDialog
          countries={ctx.countries}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditInvoiceSubmit}
        />
      ) : null}
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
          <Select
            id="year"
            className="placeholder-select w-44"
            defaultValue={currentYear.toString()}
            onChange={handleYearFilter}
            required
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
          <Select
            id="status"
            className="placeholder-select w-44"
            onChange={handleStatusFilter}
            hasClear
          >
            <option value="" disabled hidden>
              Status
            </option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="not_issued">Not issued</option>
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
        rowData={memoResults}
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