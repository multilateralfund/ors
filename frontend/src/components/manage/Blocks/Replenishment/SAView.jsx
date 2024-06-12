'use client'

import { useMemo, useState } from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, Input } from './Inputs'
import Table from './Table'
import { COUNTRIES, PERIOD } from './constants'
import { filterTableData, sortTableData } from './utils'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  {
    field: 'un_soa',
    label: 'United Nations scale of assessment for the period [PERIOD]',
  },
  {
    field: 'adj_un_soa',
    label:
      'Adjusted UN Scale of Assessment using [PERIOD] scale with no party contributing more than 22%',
  },
  {
    field: 'annual_contributions',
    label: 'Annual contributions for years [PERIOD] in (United States Dollar)',
  },
  {
    field: 'avg_ir',
    label: 'Average inflation rate for the period [PERIOD] (percent)**',
  },
  {
    field: 'qual_ferm',
    label: 'Qualifying for fixed exchange rate mechanism, use 1=Yes, 0=No',
  },
  {
    field: 'ferm_rate',
    label:
      "Fixed exchange rate mechanism users' currencies rate of Exchange 01 Jan - 30 June 2023***",
  },
  {
    field: 'ferm_cur',
    label: 'Fixed exchange mechanism users national currencies',
  },
  {
    field: 'ferm_cur_amount',
    label:
      'Fixed exchange mechanism users contribution amount in national currencies',
  },
]

const DATA = [
  {
    adj_un_soa: 0.5286,
    annual_contributions: 1000000,
    avg_ir: 9.774,
    country: 'Romania',
    ferm_cur: 'Romanian LEU',
    ferm_cur_amount: 4556580,
    ferm_rate: 4.55658,
    iso3: 'ROM',
    qual_ferm: 1,
    un_soa: 0.312,
  },
]

function populateData() {
  for (let i = 0; i < COUNTRIES.length; i++) {
    DATA.push({
      ...DATA[0],
      adj_un_soa: COUNTRIES[i].iso3 === 'USA' ? 22.0 : DATA[0].adj_un_soa,
      country: COUNTRIES[i].name_alt,
      ferm_cur: `${COUNTRIES[i].name_alt}n fiat`,
      iso3: COUNTRIES[i].iso3,
    })
  }
  DATA.splice(0, 1)
}

populateData()

const AddDialog = function AddDialog(props) {
  const { columns, ...dialogProps } = props
  return (
    <FormDialog title="Add entry" {...dialogProps}>
      <FieldSelect id="iso3" label="Country" required>
        <option value=""> - </option>
        {COUNTRIES.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id={columns[1].field}
        label={columns[1].label}
        type="number"
        required
      />
      <FieldInput
        id={columns[4].field}
        label={columns[4].label}
        type="number"
        required
      />
      <FieldInput
        id={columns[6].field}
        label={columns[6].label}
        type="number"
        required
      />
      <FieldInput
        id={columns[7].field}
        label={columns[7].label}
        type="text"
        required
      />
    </FormDialog>
  )
}

const EditDialog = function EditDialog(props) {
  return <SADialog title="Edit entry" {...props} />
}

const SADialog = function InvoiceDialog(props) {
  const { columns, data, title, ...dialogProps } = props

  return (
    <FormDialog title={title} {...dialogProps}>
      <div className="flex justify-between gap-x-8">
        <div>
          <FieldSelect
            id="iso3"
            defaultValue={data?.iso3}
            label="Country"
            required
          >
            <option value=""> - </option>
            {COUNTRIES.map((c) => (
              <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
                {c.name_alt}
              </option>
            ))}
          </FieldSelect>
          <FieldInput
            id={columns[1].field}
            defaultValue={data?.[columns[1].field]}
            label={columns[1].label}
            type="number"
            required
          />
          <FieldInput
            id={columns[2].field}
            defaultValue={data?.[columns[2].field]}
            label={columns[2].label}
            type="number"
            required
          />
          <FieldInput
            id={columns[3].field}
            defaultValue={data?.[columns[3].field]}
            label={columns[3].label}
            type="number"
            required
          />
          <FieldInput
            id={columns[4].field}
            defaultValue={data?.[columns[4].field]}
            label={columns[4].label}
            type="number"
            required
          />
        </div>
        <div>
          <FieldInput
            id={columns[5].field}
            defaultValue={data?.[columns[5].field]}
            label={columns[5].label}
            max={1}
            min={0}
            type="number"
            required
          />
          <FieldInput
            id={columns[6].field}
            defaultValue={data?.[columns[6].field]}
            label={columns[6].label}
            type="number"
            required
          />
          <FieldInput
            id={columns[7].field}
            defaultValue={data?.[columns[7].field]}
            label={columns[7].label}
            type="text"
            required
          />
          <FieldInput
            id={columns[8].field}
            defaultValue={data?.[columns[8].field]}
            label={columns[8].label}
            type="number"
            required
          />
        </div>
      </div>
    </FormDialog>
  )
}

function SATable(props) {
  return <Table {...props} />
}

function SAView(props) {
  const period = props.period ?? PERIOD

  const columns = useMemo(
    function () {
      const result = []
      for (let i = 0; i < COLUMNS.length; i++) {
        result.push({
          ...COLUMNS[i],
          label: COLUMNS[i].label.replace('[PERIOD]', period),
        })
      }
      return result
    },
    [period],
  )

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
    }
    return entry
  }, [editIdx, tableData])

  const filteredTableData = useMemo(() => {
    const data = filterTableData(tableData, searchValue)
    return sortTableData(data, columns[sortOn].field, sortDirection)
  }, [tableData, searchValue, sortOn, sortDirection, columns])

  function showAddDialog() {
    setShowAdd(true)
  }

  function showEditDialog(idx) {
    setEditIdx(idx)
  }

  function handleAddSubmit(data) {
    const entry = { ...data }
    setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
  }

  function handleDelete(idx) {
    const confirmed = confirm('Are you sure you want to delete this entry?')
    if (confirmed) {
      setTableData((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
    }
  }

  function handleEditSubmit(data) {
    const entry = { ...data }
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
        <AddDialog
          columns={columns}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddSubmit}
        />
      ) : null}
      {editData !== null ? (
        <EditDialog
          columns={columns}
          data={editData}
          onCancel={() => setEditIdx(null)}
          onSubmit={handleEditSubmit}
        />
      ) : null}
      <div className="flex items-center py-4">
        <AddButton onClick={showAddDialog}>Add entry</AddButton>
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
      <SATable
        columns={columns}
        enableEdit={true}
        enableSort={true}
        rowData={filteredTableData}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onDelete={handleDelete}
        onEdit={showEditDialog}
        onSort={handleSort}
      />
    </>
  )
}

export default SAView
