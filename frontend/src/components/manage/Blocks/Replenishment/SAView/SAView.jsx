'use client'

import { useContext, useEffect, useMemo, useState } from 'react'

import { useSnackbar } from 'notistack'

import { AddButton, SubmitButton } from '@ors/components/ui/Button/Button'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import SoAContext from '@ors/contexts/Replenishment/SoAContext'
import { api } from '@ors/helpers'

import FormDialog from '../FormDialog'
import { DateInput, FormattedNumberInput, Input } from '../Inputs'
import { dateForInput, dateFromInput } from '../utils'
import SATable from './SATable'
import {
  clearNew,
  computeTableData,
  formatTableData,
  getOverrideOrDefault,
  sortSATableData,
  sumColumns,
} from './utils'

const COLUMNS = [
  { field: 'country', label: 'Country' },
  {
    editable: true,
    field: 'un_soa',
    label: 'UN scale of assessment',
    parser: parseFloat,
    subLabel: '( [UN_SCALE_PERIOD] )',
  },
  {
    confirmationText:
      'If you make this change, this value will be fixed and all other values except for the USA will be changed accordingly.',
    editable: true,
    field: 'adj_un_soa',
    label: 'Adjusted UN Scale of Assessment',
    parser: parseFloat,
    validator: function (value) {
      if (value > 22) {
        return "Value can't be greater than 22."
      }
    },
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
    subLabel: '( [PREV_PERIOD] )',
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
    className: 'print:hidden',
    editOptions: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' },
    ],
    editParser: function (v) {
      return v ? v.toString() : 'false'
    },
    editWidget: 'select',
    editable: true,
    field: 'opted_for_ferm',
    label: 'Opted for fixed exchange rate mechanism',
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
    subLabel: '[DATE_RANGE]',
  },
  {
    editable: true,
    field: 'ferm_cur',
    label: 'National currency used for fixed exchange',
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
  const { comment, currencyDateRange, data, replenishment, version, versions } =
    props

  const { refetchData: refetchReplenishment } = useContext(ReplenishmentContext)
  const { refetchData: refetchSoA, setCurrentVersion } = useContext(SoAContext)
  const ctx = useContext(ReplenishmentContext)

  const [isFinal, setIsFinal] = useState(false)
  const [createNewVersion, setCreateNewVersion] = useState(true)
  const [saving, setSaving] = useState(false)

  const { enqueueSnackbar } = useSnackbar()

  useEffect(
    function () {
      setIsFinal(version?.is_final ?? false)
    },
    [version],
  )

  function handleChangeFinal() {
    setIsFinal(function (prev) {
      return !prev
    })
  }

  function handleChangeCreateNewVersion() {
    setCreateNewVersion(function (prev) {
      return !prev
    })
  }

  function handleSave() {
    setSaving(true)
  }

  function confirmSave(formData) {
    const saveData = {
      ...formData,
      amount: replenishment.amount,
      comment,
      data,
      replenishment_id: replenishment.id,
    }
    saveData['final'] = isFinal
    saveData['currency_date_range_start'] =
      currencyDateRange.start.toISOString()
    saveData['currency_date_range_end'] = currencyDateRange.end.toISOString()
    setSaving(false)
    api('api/replenishment/scales-of-assessment', {
      data: saveData,
      method: 'POST',
    })
      .then(() => {
        refetchReplenishment()
        refetchSoA()
        if (createNewVersion) {
          setCurrentVersion(prevVersion => prevVersion + 1)
        }
        enqueueSnackbar('Data saved successfully.', { variant: 'success' })
      })
      .catch((error) => {
        error.json().then((data) => {
          // Iterate over each error object and format it
          const messages = data
            .map((errorObj, index) => {
              // Extract the field name and the error message
              const fieldErrors = Object.entries(errorObj).map(
                ([field, errors]) => {
                  // Check if errors is an array or object
                  const errorMessage = Array.isArray(errors)
                    ? errors
                        .map((error) =>
                          typeof error === 'object'
                            ? JSON.stringify(error)
                            : error,
                        )
                        .join(' ')
                    : typeof errors === 'object'
                      ? JSON.stringify(errors)
                      : errors

                  return `Row ${index + 1}: field ${field} - ${errorMessage}\n`
                },
              )

              // Join all field errors for this particular row
              return fieldErrors.join('\n')
            })
            .join('\n\n') // Separate different row errors with double newlines

          // Display the notification with the formatted messages
          enqueueSnackbar(messages, {
            style: { whiteSpace: 'pre-line' },
            variant: 'error',
          })
        })
      })
  }

  function cancelSave() {
    setSaving(false)
  }

  const isNewestVersion = version?.version === versions[0]?.version

  const showSave = !version?.is_final && isNewestVersion

  return (
    <div className="flex items-center gap-x-4 print:hidden">
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
                  required={isFinal}
                  type="text"
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
          <div className="mt-2 flex">
            <div className="flex items-center gap-x-2">
              <Input
                id="createNewVersion"
                className="!ml-0"
                checked={createNewVersion}
                type="checkbox"
                onChange={handleChangeCreateNewVersion}
              />
              <label htmlFor="createNewVersion">Create new version</label>
            </div>
          </div>
        </FormDialog>
      ) : null}
      {showSave && ctx.isTreasurer  && (
        <>
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
        </>
      )}
    </div>
  )
}

function DateRangeInput(props) {
  const { disabled, initialEnd, initialStart, onChange } = props

  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  function handleChangeStart(evt) {
    onChange(evt.target.value, end)
    setStart(evt.target.value)
  }

  function handleChangeEnd(evt) {
    onChange(start, evt.target.value)
    setEnd(evt.target.value)
  }

  return (
    <div>
      <DateInput
        disabled={disabled}
        value={start}
        onChange={handleChangeStart}
      />
      <DateInput disabled={disabled} value={end} onChange={handleChangeEnd} />
    </div>
  )
}

function tranformContributions(cs) {
  const r = []

  for (let i = 0; i < cs.length; i++) {
    const cur = cs[i].currency
    r.push({
      adj_un_soa: cs[i].adjusted_scale_of_assessment,
      annual_contributions: cs[i].amount,
      avg_ir: cs[i].average_inflation_rate,
      country: cs[i].country.name_alt,
      country_id: cs[i].country.id,
      ferm_cur: cur && cur !== 'nan' ? cur : '',
      ferm_cur_amount: cs[i].amount_local_currency,
      ferm_rate: cs[i].exchange_rate,
      iso3: cs[i].country.iso3,
      opted_for_ferm:
        cs[i].opted_for_ferm ??
        (cs[i].qualifies_for_fixed_rate_mechanism ? false : null),
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
    ['exchange_rate', 'ferm_rate'],
    ['currency', 'ferm_cur'],
    ['un_scale_of_assessment', 'un_soa'],
  ]

  for (let i = 0; i < d.length; i++) {
    const n = {
      country_id: d[i].country_id,
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

    if (d[i].override_opted_for_ferm && d[i].qual_ferm) {
      n.opted_for_ferm = true
    }

    r.push(n)
  }

  return r
}

function getExistingCurrency(rows, value) {
  let r = null
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === value) {
      r = { ferm_rate: getOverrideOrDefault(rows[i], 'ferm_rate') }
      break
    }
  }
  return r
}

function getInitialCurrencyDateRange(year) {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 6, 0))
  return { end, start }
}

function formatCurrencyDateRangeForHeader(dateRange) {
  const { end, start } = dateRange
  const intl = new Intl.DateTimeFormat('en-US', { month: 'short' })
  return `${start.getUTCDate()} ${intl.format(start)} - ${end.getUTCDate()} ${intl.format(end)} ${start.getUTCFullYear()}`
}

function revertAllCurrencyNames(rows, value) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === value) {
      delete rows[i]['override_ferm_cur']
      delete rows[i]['override_ferm_rate']
    }
  }
}

function revertAllCurrencyRates(rows, name) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === name) {
      delete rows[i]['override_ferm_rate']
    }
  }
}

function updateAllCurrencyNames(rows, oldValue, newValue) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === oldValue) {
      rows[i]['override_ferm_cur'] = newValue
    }
  }
}

function updateAllCurrencyRates(rows, name, newValue) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === name) {
      rows[i]['override_ferm_rate'] = newValue
    }
  }
}

function SAView(props) {
  const { period } = props

  const ctx = useContext(ReplenishmentContext)
  const ctxSoA = useContext(SoAContext)
  const version = ctxSoA.version
  const versions = ctxSoA.versions

  const contributions = useMemo(
    function () {
      return tranformContributions(ctxSoA.contributions)
    },
    [ctxSoA.contributions],
  )

  const periodStart = parseInt(period.split('-')[0], 10)
  const prevPeriod = [periodStart - 3, periodStart - 1].join('-')
  const unScalePeriod = [periodStart - 2, periodStart].join('-')

  const [currencyDateRange, setCurrencyDateRange] = useState(
    getInitialCurrencyDateRange(periodStart - 1),
  )

  const columns = useMemo(
    function () {
      const result = []
      for (let i = 0; i < COLUMNS.length; i++) {
        const Label = (
          <div className="flex flex-col">
            <span>{COLUMNS[i].label}</span>
            <span className="whitespace-nowrap text-sm font-normal">
              {COLUMNS[i].subLabel
                ?.replace('[PERIOD]', period)
                .replace('[UN_SCALE_PERIOD]', unScalePeriod)
                .replace('[PREV_PERIOD]', prevPeriod)
                .replace(
                  '[DATE_RANGE]',
                  formatCurrencyDateRangeForHeader(currencyDateRange),
                )}
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
    [currencyDateRange, period, unScalePeriod, prevPeriod],
  )

  useEffect(
    function () {
      handleNewTableData(contributions)
      setReplenishment(ctxSoA.replenishment)
    },
    [contributions, ctxSoA.replenishment],
  )

  const [tableData, setTableData] = useState(contributions)
  const [shouldCompute, setShouldCompute] = useState(false)

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const [showAdd, setShowAdd] = useState(false)

  const [replenishment, setReplenishment] = useState({ amount: 0 })
  const [unusedAmount, setUnusedAmount] = useState('')

  const [commentText, setCommentText] = useState('')

  function handleNewTableData(newData) {
    setTableData(newData)
  }

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
        ? computeTableData(tableData, replenishment.amount - unusedAmount || 0)
        : tableData,
    /* eslint-disable-next-line */
    [tableData, replenishment, unusedAmount, shouldCompute],
  )

  const sortedData = useMemo(
    function () {
      return sortSATableData(computedData, columns[sortOn].field, sortDirection)
    },
    [computedData, sortOn, sortDirection, columns],
  )

  const formattedTableData = useMemo(
    function () {
      return formatTableData(sortedData, EDITABLE)
    },
    [sortedData],
  )

  const countriesForAdd = useMemo(
    function () {
      const r = []

      const knownCountries = []

      for (let i = 0; i < computedData.length; i++) {
        knownCountries.push(computedData[i].country_id)
      }

      for (let i = 0; i < ctx.countries.length; i++) {
        if (!knownCountries.includes(ctx.countries[i].id)) {
          r.push(ctx.countries[i])
        }
      }

      return r
    },
    [ctx.countries, computedData],
  )

  function showAddRow() {
    setShowAdd(true)
  }

  function handleAddSubmit(country) {
    const entry = {
      avg_ir: null,
      country: country.name_alt,
      country_id: country.id,
      ferm_cur: '',
      ferm_rate: null,
      isNew: true,
      iso3: country.iso3,
      opted_for_ferm: null,
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
      setReplenishment((oldReplenishment) => ({
        ...oldReplenishment,
        amount: value,
      }))
      setShouldCompute(true)
    }
  }

  function handleUnusedAmountInput(evt) {
    const value = parseFloat(evt.target.value)
    if (typeof value === 'number' && !isNaN(value)) {
      setUnusedAmount(value)
      setShouldCompute(true)
    } else {
      setUnusedAmount('')
    }
  }

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  function handleCellEdit(r, c, n, v) {
    const parser = columns[c].parser
    const overrideKey = `override_${n}`
    const prevValue = getOverrideOrDefault(sortedData[r], n)
    const next = [...sortedData]
    const value = parser ? parser(v) : v
    const isNullValue =
      value === '' ||
      value === undefined ||
      (typeof value === 'number' && isNaN(value))

    if (n === 'ferm_cur') {
      const existingCurrency = getExistingCurrency(sortedData, value)
      if (isNullValue) {
        next[r][overrideKey] = null
        next[r]['override_ferm_rate'] = null
      } else if (existingCurrency) {
        next[r]['override_ferm_rate'] = existingCurrency.ferm_rate
        next[r][overrideKey] = value
      } else if (prevValue === null) {
        next[r][overrideKey] = value
      } else {
        updateAllCurrencyNames(
          next,
          getOverrideOrDefault(sortedData[r], n),
          value,
        )
      }
    } else if (n === 'ferm_rate') {
      if (isNullValue) {
        next[r][overrideKey] = null
      } else if (prevValue === null) {
        next[r][overrideKey] = value
      } else {
        updateAllCurrencyRates(
          next,
          getOverrideOrDefault(sortedData[r], 'ferm_cur'),
          value,
        )
      }
    } else if (isNullValue) {
      next[r][overrideKey] = null
    } else if (next[r][n] === value) {
      delete next[r][overrideKey]
    } else {
      next[r][overrideKey] = value
    }
    setTableData(next)
    setShouldCompute(true)
  }

  function handleCellRevert(r, n) {
    const overrideKey = `override_${n}`
    const next = [...sortedData]

    if (n === 'ferm_cur') {
      revertAllCurrencyNames(
        next,
        getOverrideOrDefault(sortedData[r], 'ferm_cur'),
      )
    } else if (n === 'ferm_rate') {
      revertAllCurrencyRates(
        next,
        getOverrideOrDefault(sortedData[r], 'ferm_cur'),
      )
    } else {
      delete next[r][overrideKey]
    }
    setTableData(next)
    setShouldCompute(true)
  }

  function handleCommentInput(evt) {
    setCommentText(evt.target.value)
  }

  function handleChangeCurrencyDateRange(start, end) {
    setCurrencyDateRange({
      end: dateFromInput(end),
      start: dateFromInput(start),
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex py-4 sm:flex-col 2xl:flex-row 2xl:items-center 2xl:gap-x-4 print:hidden">
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
                disabled={!ctx.isTreasurer}
                type="number"
                value={replenishment?.amount}
                onChange={handleAmountInput}
              />
            </div>
            <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
            <div className="flex items-center">
              <label htmlFor="triannualBudget_mask">
                <div className="flex flex-col uppercase text-primary">
                  <span className="font-bold">Previously unused sum</span>
                  <span className="">(in U.S.D)</span>
                </div>
              </label>
              <FormattedNumberInput
                id="previouslyUnusedSum"
                className="w-36"
                disabled={!ctx.isTreasurer}
                type="number"
                value={unusedAmount}
                onChange={handleUnusedAmountInput}
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
                value={(replenishment?.amount - unusedAmount || 0) / 3}
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400 sm:hidden 2xl:block"></div>
          <div className="flex items-center">
            <label>
              <div className="flex flex-col uppercase text-primary">
                <span className="max-w-28 font-bold">
                  Currency rate date range
                </span>
              </div>
            </label>
            <DateRangeInput
              disabled={!ctx.isTreasurer}
              initialEnd={dateForInput(currencyDateRange.end)}
              initialStart={dateForInput(currencyDateRange.start)}
              onChange={handleChangeCurrencyDateRange}
            />
          </div>
        </div>
        <SaveManager
          comment={commentText}
          currencyDateRange={currencyDateRange}
          data={transformForSave(tableData)}
          replenishment={replenishment}
          version={version}
          versions={versions}
        />
      </div>
      <SATable
        adminButtons={ctx.isTreasurer}
        columns={columns}
        countriesForAdd={countriesForAdd}
        enableEdit={ctx.isTreasurer}
        enableSort={true}
        extraRows={[{ country: 'Total', ...sumColumns(computedData) }]}
        rowData={formattedTableData}
        showAdd={showAdd}
        sortDirection={sortDirection}
        sortOn={sortOn}
        onAddCancel={() => setShowAdd(false)}
        onAddSubmit={handleAddSubmit}
        onCellEdit={handleCellEdit}
        onCellRevert={handleCellRevert}
        onDelete={handleDelete}
        onSort={handleSort}
      />
      {!showAdd ? (
        <div className="flex items-center py-4 print:hidden">
          <AddButton onClick={showAddRow}>Add country</AddButton>
        </div>
      ) : null}
      <div className="-mx-4 -mb-4 rounded-b-lg bg-gray-200 p-4 print:hidden">
        <div className="flex items-center gap-x-2">
          <h2>Comment Version {version?.version} </h2>
          {version?.meeting_number ? (
            <div className="rounded bg-primary px-1 font-medium uppercase text-mlfs-hlYellow">
              Meeting {version.meeting_number}
            </div>
          ) : null}
          {version?.decision_number ? (
            <div className="rounded bg-primary px-1 font-medium uppercase text-mlfs-hlYellow">
              Decision {version.decision_number}
            </div>
          ) : null}
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

function SAViewWrapper(props) {
  // Wrapper used to avoid flicker when no period is given.
  return props.period ? <SAView {...props} /> : <div className="h-screen"></div>
}

export default SAViewWrapper
