'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import { AddButton } from '@ors/components/ui/Button/Button'

import FormDialog from './FormDialog'
import { FieldInput, FieldSelect, FormattedNumberInput, Input } from './Inputs'
import Table from './Table'
import {
  computeTableData,
  filterTableData,
  formatTableData,
  sortTableData,
  sumColumns,
} from './utils'

const REPLENISHMENT_AMOUNT = 175200000
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'
import { formatApiUrl } from '@ors/helpers/Api/utils'

import styles from './table.module.css'

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

const AddDialog = function AddDialog(props) {
  const { columns, countries, ...dialogProps } = props
  return (
    <FormDialog title="Add entry" {...dialogProps}>
      <FieldSelect id="iso3" label="Country" required>
        <option value=""> - </option>
        {countries.map((c) => (
          <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
            {c.name_alt}
          </option>
        ))}
      </FieldSelect>
      <FieldInput
        id={columns[1].field}
        label={columns[1].label}
        step="0.000001"
        type="number"
        required
      />
      <FieldInput
        id={columns[4].field}
        label={columns[4].label}
        step="0.000001"
        type="number"
        required
      />
      <FieldInput
        id={columns[6].field}
        label={columns[6].label}
        step="0.000001"
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
  const {
    columns,
    countries,
    editIdx,
    replenishmentAmount,
    tableData,
    title,
    ...dialogProps
  } = props

  const [computedData, setComputedData] = useState(tableData)

  const data = useMemo(
    function () {
      return computedData[editIdx]
    },
    [computedData, editIdx],
  )

  function handleChange(name) {
    return function handler(evt) {
      setComputedData(function (prevData) {
        const nextData = [...prevData]
        nextData[editIdx][name] =
          parseFloat(evt.target.value) ?? prevData[editIdx][name]
        return computeTableData(nextData, replenishmentAmount)
      })
    }
  }

  return (
    <FormDialog title="Edit entry" {...dialogProps}>
      <div className="flex justify-between gap-x-8">
        <div>
          <FieldSelect
            id="iso3"
            defaultValue={data?.iso3}
            label="Country"
            required
          >
            <option value=""> - </option>
            {countries.map((c) => (
              <option key={c.iso3} data-name={c.name_alt} value={c.iso3}>
                {c.name_alt}
              </option>
            ))}
          </FieldSelect>
          <FieldInput
            id={columns[1].field}
            label={columns[1].label}
            step="0.000001"
            type="number"
            value={data?.[columns[1].field]}
            onChange={handleChange(columns[1].field)}
            required
          />
          <FieldInput
            id={columns[2].field}
            label={columns[2].label}
            step="0.000001"
            type="number"
            value={data?.[columns[2].field]}
            disabled
            readOnly
            required
          />
          <FieldInput
            id={columns[3].field}
            label={columns[3].label}
            step="0.000001"
            type="number"
            value={data?.[columns[3].field]}
            disabled
            readOnly
            required
          />
          <FieldInput
            id={columns[4].field}
            label={columns[4].label}
            step="0.000001"
            type="number"
            value={data?.[columns[4].field]}
            onChange={handleChange(columns[4].field)}
            required
          />
        </div>
        <div>
          <FieldInput
            id={columns[5].field}
            label={columns[5].label}
            max={1}
            min={0}
            type="number"
            value={data?.[columns[5].field]}
            disabled
            readOnly
            required
          />
          <FieldInput
            id={columns[6].field}
            label={columns[6].label}
            step="0.000001"
            type="number"
            value={data?.[columns[6].field]}
            onChange={handleChange(columns[6].field)}
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
            label={columns[8].label}
            step="0.000001"
            type="number"
            value={data?.[columns[8].field]}
            disabled
            readOnly
            required
          />
        </div>
      </div>
    </FormDialog>
  )
}

function SATable(props) {
  return <Table {...props} className={styles.replenishmentTable} />
}

function tranformContributions(cs) {
  const r = []

  for (let i = 0; i < cs.length; i++) {
    r.push({
      adj_un_soa: cs[i].adjusted_scale_of_assessment,
      annual_contributions: cs[i].amount,
      avg_ir: cs[i].average_inflation_rate,
      country: cs[i].country.name_alt,
      ferm_cur: cs[i].currency,
      ferm_cur_amount: cs[i].amount_local_currency,
      ferm_rate: cs[i].exchange_rate,
      iso3: cs[i].country.iso3,
      qual_ferm: cs[i].qualifies_for_fixed_rate_mechanism ? 1 : 0,
      un_soa: cs[i].un_scale_of_assessment,
    })
  }

  return r
}

function useApiReplenishment(startYear) {
  const [contributions, setContributions] = useState([])
  const [replenishmentAmount, setReplenishmentAmount] = useState(0)

  useEffect(
    function () {
      const path = [
        '/api/replenishment/contributions',
        new URLSearchParams({ start_year: startYear }),
      ].join('?')

      fetch(formatApiUrl(path), {
        credentials: 'include',
      })
        .then(function (resp) {
          return resp.json()
        })
        .then(function (jsonData) {
          setContributions(tranformContributions(jsonData))
          if (jsonData.length > 0) {
            setReplenishmentAmount(jsonData[0].replenishment.amount)
          }
        })
    },
    [startYear],
  )

  return { contributions, replenishmentAmount }
}

function SAView(props) {
  const { period } = props

  const ctx = useContext(ReplenishmentContext)

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

  const { contributions, replenishmentAmount: apiReplenishmentAmount } =
    useApiReplenishment(period.split('-')[0])

  useEffect(
    function () {
      setTableData(contributions)
      setReplenishmentAmount(apiReplenishmentAmount)
    },
    [contributions, apiReplenishmentAmount],
  )

  const [tableData, setTableData] = useState(contributions)
  const [shouldCompute, setShouldCompute] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const [replenishmentAmount, setReplenishmentAmount] =
    useState(REPLENISHMENT_AMOUNT)

  const computedData = useMemo(
    () => computeTableData(tableData, replenishmentAmount),
    /* eslint-disable-next-line */
    [tableData, replenishmentAmount, shouldCompute],
  )

  // const editData = useMemo(() => {
  //   let entry = null
  //   if (editIdx !== null) {
  //     entry = { ...computedData[editIdx] }
  //   }
  //   return entry
  // }, [editIdx, computedData])

  const filteredTableData = useMemo(() => {
    const filteredData = filterTableData(computedData, searchValue)
    const sortedData = sortTableData(
      filteredData,
      columns[sortOn].field,
      sortDirection,
    )
    const formattedData = formatTableData(sortedData)
    return formattedData
  }, [computedData, searchValue, sortOn, sortDirection, columns])

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
    setShouldCompute(true)
  }

  function handleDelete(idx) {
    const confirmed = confirm('Are you sure you want to delete this entry?')
    if (confirmed) {
      setTableData((prev) => {
        const next = [...prev]
        next.splice(idx, 1)
        return next
      })
      setShouldCompute(true)
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
    setShouldCompute(true)
  }

  function handleSearchInput(evt) {
    setSearchValue(evt.target.value)
  }

  function handleAmountInput(evt) {
    setReplenishmentAmount(parseFloat(evt.target.value))
    setShouldCompute(true)
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
          countries={ctx.countries}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAddSubmit}
        />
      ) : null}
      {editIdx !== null ? (
        <EditDialog
          columns={columns}
          countries={ctx.countries}
          editIdx={editIdx}
          replenishmentAmount={replenishmentAmount}
          tableData={computedData}
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
        <div className="ml-8">
          <label>
            Replenishment amount:{' '}
            <FormattedNumberInput
              id="totalAmount"
              type="number"
              value={replenishmentAmount}
              onChange={handleAmountInput}
            />
          </label>
        </div>
      </div>
      <SATable
        columns={columns}
        enableEdit={true}
        enableSort={true}
        sortDirection={sortDirection}
        sortOn={sortOn}
        rowData={[
          ...filteredTableData,
          { country: 'Total', ...sumColumns(computedData) },
        ]}
        onDelete={handleDelete}
        onEdit={showEditDialog}
        onSort={handleSort}
      />
    </>
  )
}

export default SAView
