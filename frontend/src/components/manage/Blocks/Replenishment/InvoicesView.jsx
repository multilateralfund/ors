'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import cx from 'classnames'

import { AddButton, DeleteButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input, Select } from './Inputs'
import Table from './Table'
import {
  dateForEditField,
  filterTableData,
  formatDateValue,
  formatNumberValue,
  getCountryForIso3,
  numberForEditField,
  sortTableData,
} from './utils'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'sent_out', label: 'Sent out' },
  { field: 'amount', label: 'Amount' },
  { field: 'number', label: 'Number' },
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

function InvoiceAttachments(props) {
  const [files, setFiles] = useState([{ id: 1 }])
  const [selected, setSelected] = useState([])

  function handleNewFileField() {
    setFiles((prev) => [...prev, { id: [...prev].pop().id + 1 }])
  }

  function handleDeleteSelectedFileFields() {
    setFiles(function (prev) {
      const result = []
      for (let i = 0; i < files.length; i++) {
        if (!selected.includes(i)) {
          result.push(files[i])
        }
      }
      if (result.length === 0) {
        result.push({ id: 1 })
      }
      return result
    })
    setSelected([])
  }

  function handleToggleSelected(idx) {
    function toggle() {
      setSelected(function (prev) {
        const result = []
        let removed = false
        for (let i = 0; i < prev.length; i++) {
          if (prev[i] !== idx) {
            result.push(prev[i])
          } else {
            removed = true
          }
        }

        if (!removed) {
          result.push(idx)
        }

        return result
      })
    }
    return toggle
  }

  return (
    <div>
      <div className="font-sm flex justify-between">
        <AddButton
          className="p-[0px] text-sm"
          iconSize={14}
          type="button"
          onClick={handleNewFileField}
        >
          Add another
        </AddButton>
        {selected.length ? (
          <DeleteButton
            className="py-1 text-sm"
            type="button"
            onClick={handleDeleteSelectedFileFields}
          >
            Remove selected
          </DeleteButton>
        ) : null}
      </div>
      <div className="">
        {files.map((o, i) => {
          return (
            <div
              key={o.id}
              className={cx('flex justify-between py-2 [&_select]:ml-0')}
            >
              <Select id={`file_type_${i}`}>
                <option value="invoice">Invoice</option>
                <option value="reminder">Reminder</option>
              </Select>
              <Input id={`file_${i}`} type="file" />
              <Input
                id={`file_chk_${i}`}
                checked={selected.includes(i)}
                type="checkbox"
                onClick={handleToggleSelected(i)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AddInvoiceDialog = function AddInvoiceDialog(props) {
  return <InvoiceDialog title="Add invoice" {...props} />
}

const EditInvoiceDialog = function EditInvoiceDialog(props) {
  return <InvoiceDialog title="Edit invoice" {...props} />
}

const InvoiceDialog = function InvoiceDialog(props) {
  const { countries, data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <FieldSelect id="iso3" defaultValue={data?.iso3} label="Country" required>
        <option value=""> - </option>
        {countries.map((c) => (
          <option key={c.iso3} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id="number"
        defaultValue={data?.number}
        label="Invoice number"
        type="text"
        required
      />
      <FieldInput
        id="date"
        defaultValue={data?.date}
        label="Date"
        type="date"
        required
      />
      <FieldInput
        id="sent_out"
        defaultValue={data?.sent_out}
        label="Sent out"
        type="date"
        required
      />
      <FieldInput
        id="amount"
        defaultValue={data?.amount}
        label={COLUMNS[3].label}
        type="number"
        required
      />
      <h5>Files</h5>
      <InvoiceAttachments />
    </FormDialog>
  )
}

function InvoicesTable(props) {
  return <Table columns={COLUMNS} {...props} />
}

function InvoicesView(props) {
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
      entry.date = dateForEditField(entry.date)
      entry.sent_out = dateForEditField(entry.sent_out)
      entry.amount = numberForEditField(entry.amount)
    }
    return entry
  }, [editIdx, sortedTableData])

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
          countries={ctx.countries}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditInvoiceSubmit}
        />
      ) : null}
      <div className="flex items-center py-4 print:hidden">
        <AddButton onClick={showAddInvoiceDialog}>Add invoice</AddButton>
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
      <InvoicesTable
        enableEdit={true}
        enableSort={true}
        rowData={sortedTableData}
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
