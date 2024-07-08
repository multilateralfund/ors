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
  clearNew,
  computeTableData,
  formatTableData,
  getCountryForIso3,
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
    subLabel: '( YYYY - YYYY )',
  },
  {
    confirmationText:
      'If you make this change, this value will be fixed and all other values except for the USA will be changed accordingly.',
    editable: true,
    field: 'adj_un_soa',
    label: 'Adjusted UN Scale of Assessment',
    parser: parseFloat,
  },
  {
    field: 'annual_contributions',
    label: 'Annual contributions',
    subLabel: '([PERIOD] in U.S.D)',
  },
  {
    editable: true,
    field: 'avg_ir',
    label: 'Average inflation rate',
    parser: parseFloat,
    subLabel: '( YYYY - YYYY )',
  },
  {
    editOptions: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
    editParser: function (v) {
      return v ? v.toString() : 'false'
    },
    // editWidget: 'select',
    // editable: true,
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
    subLabel: '(01 Jan - 30 Jun YYYY)',
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

function SaveManager(props) {
  const { amount, comment, data } = props

  const [isFinal, setIsFinal] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleChangeFinal() {
    setIsFinal(function (prev) {
      return !prev
    })
  }

  function handleSave() {
    setSaving(true)
  }

  function confirmSave(formData) {
    const saveData = { ...formData, amount, comment, data }
    saveData['final'] = isFinal
    setSaving(false)
    alert(`Save not implemented!\n\n${JSON.stringify(saveData, undefined, 2)}`)
  }

  function cancelSave() {
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-x-4">
      {saving ? (
        <FormDialog
          title="Save changes?"
          onCancel={cancelSave}
          onSubmit={confirmSave}
        >
          <div className="flex justify-between gap-4">
            <p className="w-8/12 text-lg">
              You can specify meeting and decision numbers where this version
              was approved.
            </p>
            <div className="flex w-4/12 gap-4">
              <div className="flex flex-col">
                <label htmlFor="meeting">Meeting</label>
                <Input
                  id="meeting"
                  className="!m-0 max-h-12 w-16 !py-1"
                  type="text"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="decision">Decision</label>
                <Input
                  id="decision"
                  className="!m-0 max-h-12 w-16 !py-1"
                  required={isFinal}
                  type="text"
                />
              </div>
            </div>
          </div>
        </FormDialog>
      ) : null}
      <div className="flex items-center gap-x-2">
        <Input
          id="markAsFinal"
          checked={isFinal}
          type="checkbox"
          onChange={handleChangeFinal}
        />
        <label htmlFor="markAsFinal">Mark as final</label>
      </div>
      <SubmitButton onClick={handleSave}>Save changes</SubmitButton>
    </div>
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
      country_id: cs[i].country.id,
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

function transformForSave(d) {
  const r = []

  const mapping = [
    ['average_inflation_rate', 'avg_ir'],
    ['currency', 'ferm_cur'],
    ['exchange_rate', 'ferm_rate'],
    ['un_scale_of_assessment', 'un_soa'],
  ]

  for (let i = 0; i < d.length; i++) {
    const n = {
      country: d[i].country_id,
    }

    for (let j = 0; j < mapping.length; j++) {
      const serverKey = mapping[j][0]
      const dataKey = mapping[j][1]
      const overrideKey = `override_${dataKey}`
      if (d[i].hasOwnProperty(overrideKey)) {
        n[serverKey] = d[i][overrideKey]
      } else {
        n[serverKey] = d[i][dataKey]
      }
    }

    if (!isNaN(d[i].override_adj_un_soa)) {
      n.override_adjusted_scale_of_assessment = d[i].override_adj_un_soa
    }

    if (d[i].hasOwnProperty('override_qual_ferm')) {
      n.override_qualifies_for_fixed_rate_mechanism = d[i].override_qual_ferm
    }

    r.push(n)
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

  const [showAdd, setShowAdd] = useState(false)

  const [replenishmentAmount, setReplenishmentAmount] = useState(0)

  const [commentText, setCommentText] = useState('')

  useEffect(
    function () {
      const newRow = document.querySelector('table tr.isNew')
      if (newRow) {
        newRow.classList.add('bg-secondary')
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(function () {
          setTableData(clearNew(tableData))
        }, 500)
      }
    },
    [tableData],
  )

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

  function showAddRow() {
    setShowAdd(true)
  }

  function handleAddSubmit(country) {
    const entry = {
      avg_ir: null,
      country: country.name_alt,
      country_id: country.id,
      ferm_cur: null,
      ferm_rate: null,
      isNew: true,
      iso3: country.iso3,
      qual_ferm: false,
      un_soa: 0.0,
    }
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
    const value = parseFloat(evt.target.value)
    if (typeof value === 'number' && !isNaN(value)) {
      setReplenishmentAmount(value)
      setShouldCompute(true)
    }
  }

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  function handleCellEdit(r, c, n, v) {
    const parser = columns[c].parser
    const overrideKey = `override_${n}`
    const next = [...sortedData]
    const value = parser ? parser(v) : v
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
    setTableData(next)
    setShouldCompute(true)
  }

  function handleCommentInput(evt) {
    setCommentText(evt.target.value)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4 py-4">
          <div className="flex items-center">
            <label htmlFor="triannualBudget_mask">
              <div className="flex flex-col uppercase text-primary">
                <span className="font-bold">Triannual budget</span>
                <span className="">(in U.S.D)</span>
              </div>
            </label>
            <FormattedNumberInput
              id="triannualBudget"
              className="w-36"
              type="number"
              value={replenishmentAmount}
              onChange={handleAmountInput}
            />
          </div>
          <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
          <div className="flex items-center">
            <label htmlFor="totalAmount_mask">
              <div className="flex flex-col uppercase text-primary">
                <span className="font-bold">Annual budget</span>
                <span className="">(in U.S.D)</span>
              </div>
            </label>
            <FormattedNumberInput
              id="totalAmount"
              className="w-36"
              type="number"
              value={replenishmentAmount / 3}
              disabled
              readOnly
            />
          </div>
        </div>
        <SaveManager
          amount={replenishmentAmount}
          comment={commentText}
          data={transformForSave(tableData)}
        />
      </div>
      <SATable
        columns={columns}
        countries={ctx.countries}
        enableEdit={true}
        enableSort={true}
        extraRows={[{ country: 'Total', ...sumColumns(computedData) }]}
        rowData={formattedTableData}
        showAdd={showAdd}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onAddCancel={() => setShowAdd(false)}
        onAddSubmit={handleAddSubmit}
        onCellEdit={handleCellEdit}
        onDelete={handleDelete}
        onSort={handleSort}
      />
      {!showAdd ? (
        <div className="flex items-center py-4">
          <AddButton onClick={showAddRow}>Add country</AddButton>
        </div>
      ) : null}
      <div className="-mx-4 -mb-4 rounded-b-lg bg-gray-200 p-4">
        <div className="flex items-center gap-x-2">
          <h2>Comment Version N</h2>
          <div className="rounded bg-primary px-1 font-medium uppercase text-mlfs-hlYellow">
            Meeting {`NN`}
          </div>
          <div className="rounded bg-primary px-1 font-medium uppercase text-mlfs-hlYellow">
            Decision {`NN`}
          </div>
        </div>
        <textarea
          className="h-32 w-3/4 rounded-lg border-0 bg-white p-2"
          value={commentText}
          onChange={handleCommentInput}
        ></textarea>
      </div>
    </>
  )
}

export default SAView
