'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import { AddButton, SubmitButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'
import { formatApiUrl } from '@ors/helpers/Api/utils'

import FormDialog from '../FormDialog'
import { FieldInput, FieldSelect, FormattedNumberInput, Input } from '../Inputs'
import SATable from './SATable'
import {
  computeTableData,
  formatTableData,
  sortTableData,
  sumColumns,
} from './utils'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  {
    editable: true,
    field: 'un_soa',
    label: 'UN scale of assessment',
    parser: parseFloat,
    subLabel: '([PERIOD])',
  },
  {
    editable: true,
    field: 'adj_un_soa',
    label: 'Adjusted UN Scale of Assessment',
    parser: parseFloat,
  },
  {
    field: 'annual_contributions',
    label: 'Annual contributions',
    subLabel: '([PERIOD] in U.S. Dollar)',
  },
  {
    editable: true,
    field: 'avg_ir',
    label: 'Average inflation rate',
    parser: parseFloat,
    subLabel: '([PERIOD])',
  },
  {
    editable: true,
    field: 'qual_ferm',
    label: 'Qualifying for fixed exchange rate mechanism',
    parser: function (v) {
      return v === 'true' || v === 't' || v === 'y' || v === '1'
    },
    subLabel: '(Yes / No)',
  },
  {
    editable: true,
    field: 'ferm_rate',
    label: 'Currency rate of exchange used for fixed exchange',
    parser: parseFloat,
    subLabel: '(01 Jan - 30 Jun 2023)',
  },
  {
    editable: true,
    field: 'ferm_cur',
    label: 'National currencies used for fixed exchange',
  },
  {
    field: 'ferm_cur_amount',
    label: 'Contribution amount in national currencies',
    subLabel: '(for fixed exchange mechanism)',
  },
]

function getEditableFieldNames(cs) {
  const r = []
  for (let i = 0; i < cs.length; i++) {
    if (cs[i].editable === true) {
      r.push(cs[i].field)
    }
  }
  return r
}

const EDITABLE = getEditableFieldNames(COLUMNS)

const AddDialog = function AddDialog(props) {
  const { columns, countries, ...dialogProps } = props
  return (
    <FormDialog title="Add country" {...dialogProps}>
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
      qual_ferm: cs[i].qualifies_for_fixed_rate_mechanism,
      un_soa: cs[i].un_scale_of_assessment,
    })
  }

  return r
}

function useApiReplenishment(startYear) {
  const [contributions, setContributions] = useState([])
  const [replenishmentAmount, setReplenishmentAmount] = useState(0)
  const [loading, setLoading] = useState(false)

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
        const Label = (
          <div className="flex flex-col">
            <span>{COLUMNS[i].label}</span>
            <span className="whitespace-nowrap text-sm font-normal">
              {COLUMNS[i].subLabel?.replace('[PERIOD]', period)}
            </span>
          </div>
        )
        result.push({
          ...COLUMNS[i],
          label: Label,
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

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [editIdx, setEditIdx] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const [replenishmentAmount, setReplenishmentAmount] = useState(0)

  const computedData = useMemo(
    () =>
      shouldCompute
        ? computeTableData(tableData, replenishmentAmount)
        : tableData,
    /* eslint-disable-next-line */
    [tableData, replenishmentAmount, shouldCompute],
  )

  const sortedData = useMemo(
    function () {
      return sortTableData(computedData, columns[sortOn].field, sortDirection)
    },
    [computedData, sortOn, sortDirection, columns],
  )

  const formattedTableData = useMemo(
    function () {
      return formatTableData(sortedData, EDITABLE)
    },
    [sortedData],
  )

  function showAddDialog() {
    setShowAdd(true)
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
      const next = []
      for (let i = 0; i < sortedData.length; i++) {
        if (i !== idx) {
          next.push(sortedData[i])
        }
      }
      setTableData(next)
      setShouldCompute(true)
    }
  }

  function handleAmountInput(evt) {
    setReplenishmentAmount(parseFloat(evt.target.value))
    setShouldCompute(true)
  }

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  function handleCellEdit(r, c, n, v) {
    const parser = columns[c].parser
    const overrideKey = `override_${n}`
    setTableData((prev) => {
      const next = [...prev]
      let value = v
      if (parser) {
        value = parser(v)
      }
      if (
        value === '' ||
        value === undefined ||
        (typeof value === 'number' && isNaN(value)) ||
        next[r][n] === value
      ) {
        delete next[r][overrideKey]
      } else {
        next[r][overrideKey] = value
      }
      return next
    })
    setShouldCompute(true)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4 py-4">
          <div className="flex items-center">
            <label htmlFor="triannualBudget_mask">
              <div className="flex flex-col uppercase text-primary">
                <span className="font-bold">Triannual budget</span>
                <span className="">(in u.s. dollar)</span>
              </div>
            </label>
            <FormattedNumberInput
              id="triannualBudget"
              className="w-36"
              type="number"
              value={replenishmentAmount * 3}
              disabled
              readOnly
            />
          </div>
          <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
          <div className="flex items-center">
            <label htmlFor="totalAmount_mask">
              <div className="flex flex-col uppercase text-primary">
                <span className="font-bold">Annual budget</span>
                <span className="">(in u.s. dollar)</span>
              </div>
            </label>
            <FormattedNumberInput
              id="totalAmount"
              className="w-36"
              type="number"
              value={replenishmentAmount}
              onChange={handleAmountInput}
            />
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-x-2">
            <Input id="markAsFinal" type="checkbox" />
            <label htmlFor="markAsFinal">Mark as final</label>
          </div>
          <SubmitButton onClick={() => confirm('Not yet implemented')}>
            Save changes
          </SubmitButton>
        </div>
      </div>
      <SATable
        columns={columns}
        enableEdit={true}
        enableSort={true}
        extraRows={[{ country: 'Total', ...sumColumns(computedData) }]}
        rowData={formattedTableData}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onCellEdit={handleCellEdit}
        onDelete={handleDelete}
        onSort={handleSort}
      />
      <div className="flex items-center py-4">
        <AddButton onClick={showAddDialog}>Add country</AddButton>
      </div>
    </>
  )
}

export default SAView
