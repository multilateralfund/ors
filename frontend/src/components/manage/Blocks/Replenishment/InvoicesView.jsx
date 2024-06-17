'use client'

import { useMemo, useState } from 'react'

import cx from 'classnames'

import { AddButton, DeleteButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input, Select } from './Inputs'
import Table from './Table'
import { COUNTRIES } from './constants'
import {
  dateForEditField,
  filterTableData,
  formatDateValue,
  formatNumberValue,
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

function populateData() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    DATA.push({
      ...DATA[0],
      country: COUNTRIES[i].name_alt,
      iso3: COUNTRIES[i].iso3,
      number: `${DATA[0].number.split('-').slice(0, 2).join('-')}-${COUNTRIES[i].iso3}`,
    })
  }
  DATA.splice(0, 1)
}

populateData()

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
  const { data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <FieldSelect id="iso3" defaultValue={data?.iso3} label="Country" required>
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
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
  const [tableData, setTableData] = useState(DATA)
  const [searchValue, setSearchValue] = useState('')

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...tableData[editIdx] }
      entry.date = dateForEditField(entry.date)
      entry.sent_out = dateForEditField(entry.sent_out)
      entry.amount = numberForEditField(entry.amount)
    }
    return entry
  }, [editIdx, tableData])

  const filteredTableData = useMemo(() => {
    const data = filterTableData(tableData, searchValue)
    return sortTableData(data, COLUMNS[sortOn].field, sortDirection)
  }, [tableData, searchValue, sortOn, sortDirection])

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
    setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
  }

  function handleDeleteInvoice(idx) {
    const confirmed = confirm('Are you sure you want to delete this invoice?')
    if (confirmed) {
      setTableData((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
    }
  }

  function handleEditInvoiceSubmit(data) {
    const entry = { ...data }
    entry.date = formatDateValue(entry.date)
    entry.sent_out = formatDateValue(entry.sent_out)
    entry.amount = formatNumberValue(entry.amount)
    setTableData((prev) => {
      const next = [...prev]
      next[editIdx] = entry
      return next
    })
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
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddInvoiceSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditInvoiceDialog
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditInvoiceSubmit}
        />
      ) : null}
      <div className="flex items-center py-4">
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
        rowData={filteredTableData}
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
