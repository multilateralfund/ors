'use client'

import { useMemo, useState } from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input } from './Inputs'
import Table from './Table'
import { COUNTRIES } from './constants'
import { dateForEditField, filterTableData, formatDateValue } from './utils'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'date', label: 'Date' },
  { field: 'sent_out', label: 'Sent out' },
  { field: 'number', label: 'Number' },
]

const DATA = [
  {
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
    </FormDialog>
  )
}

function InvoicesTable(props) {
  return <Table columns={COLUMNS} {...props} />
}

function InvoicesView(props) {
  const [tableData, setTableData] = useState(DATA)
  const [searchValue, setSearchValue] = useState('')

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const editData = useMemo(() => {
    let entry = null
    if (editIdx !== null) {
      entry = { ...tableData[editIdx] }
      entry.date = dateForEditField(entry.date)
      entry.sent_out = dateForEditField(entry.sent_out)
    }
    return entry
  }, [editIdx, tableData])

  const filteredTableData = useMemo(() => {
    return filterTableData(tableData, searchValue)
  }, [tableData, searchValue])

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
        rowData={filteredTableData}
        onDelete={handleDeleteInvoice}
        onEdit={showEditInvoiceDialog}
      />
    </>
  )
}

export default InvoicesView
