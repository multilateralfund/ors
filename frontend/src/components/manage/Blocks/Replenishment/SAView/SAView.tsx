'use client'

import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { ApiReplenishmentSoA } from '@ors/types/api_replenishment_scales_of_assessment'
import { Country } from '@ors/types/store'

import {
  ChangeEventHandler,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Big from 'big.js'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import { DateRangeInput } from '@ors/components/manage/Blocks/Replenishment/Inputs/DateRangeInput'
import COLUMNS from '@ors/components/manage/Blocks/Replenishment/SAView/COLUMNS'
import { SaveManager } from '@ors/components/manage/Blocks/Replenishment/SAView/SaveManager'
import {
  asDecimal,
  formatIso8601DateString,
} from '@ors/components/manage/Blocks/Replenishment/utils'
import { AddButton } from '@ors/components/ui/Button/Button'
import Link from '@ors/components/ui/Link/Link'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import SoAContext from '@ors/contexts/Replenishment/SoAContext'
import { formatApiUrl, getFloat } from '@ors/helpers'

import { FormattedNumberInput } from '../Inputs'
import { SortDirection } from '../Table/types'
import SATable from './SATable'
import {
  SAContribution,
  SAContributionForSave,
  SATableColumn,
  SAViewProps,
  SAViewWrapperProps,
} from './types'
import {
  checkQualifiesForFerm,
  clearNew,
  computeTableData,
  formatTableData,
  getOverrideOrDefault,
  sortSATableData,
  sumColumns,
} from './utils'

function getEditableFieldNames(cs: SATableColumn[]) {
  const r = []
  for (let i = 0; i < cs.length; i++) {
    if (cs[i].editable === true) {
      r.push(cs[i].field)
    }
  }
  return r
}

const EDITABLE = getEditableFieldNames(COLUMNS)

function transformContributions(cs: ApiReplenishmentSoA) {
  const r: SAContribution[] = []

  for (let i = 0; i < cs.length; i++) {
    const entry = cs[i]
    const cur = entry.currency
    const parsed: SAContribution = {
      adj_un_soa: asDecimal(entry.adjusted_scale_of_assessment, null),
      annual_contributions: asDecimal(entry.yearly_amount, null),
      avg_ir: asDecimal(entry.average_inflation_rate, null),
      country: entry.country.name_alt,
      country_id: entry.country.id,
      ferm_cur: cur && cur !== 'nan' ? cur : '',
      ferm_cur_amount: asDecimal(entry.yearly_amount_local_currency, null),
      ferm_rate: asDecimal(entry.exchange_rate, null),
      iso3: entry.country.iso3,
      opted_for_ferm: entry.opted_for_ferm,
      qual_ferm: entry.qualifies_for_fixed_rate_mechanism,
      un_soa: asDecimal(entry.un_scale_of_assessment, null),
    }
    r.push(parsed)
  }

  return r
}

function transformForSave(d: SAContribution[]) {
  const r: SAContributionForSave[] = []

  const mapping = [
    ['average_inflation_rate', 'avg_ir'],
    ['exchange_rate', 'ferm_rate'],
    ['currency', 'ferm_cur'],
    ['un_scale_of_assessment', 'un_soa'],
    ['opted_for_ferm', 'opted_for_ferm'],
  ]

  for (let i = 0; i < d.length; i++) {
    const n: Record<string, any> = {
      country_id: d[i].country_id,
    }

    for (let j = 0; j < mapping.length; j++) {
      const serverKey = mapping[j][0] as keyof SAContributionForSave
      const dataKey = mapping[j][1] as keyof SAContribution
      const overrideKey = `override_${dataKey}` as keyof SAContribution
      if (d[i].hasOwnProperty(overrideKey)) {
        n[serverKey] = d[i][overrideKey]
      } else {
        n[serverKey] = d[i][dataKey]
      }
    }

    if (d[i].override_adj_un_soa instanceof Big) {
      n.override_adjusted_scale_of_assessment =
        d[i].override_adj_un_soa?.toString()
    }

    if (d[i].hasOwnProperty('override_qual_ferm')) {
      n.override_qualifies_for_fixed_rate_mechanism = d[i].override_qual_ferm
    }

    if (d[i].override_opted_for_ferm && d[i].qual_ferm) {
      n.opted_for_ferm = true
    }

    r.push(n as SAContributionForSave)
  }

  return r
}

function getExistingCurrency(rows: SAContribution[], value: any) {
  let r = null
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === value) {
      r = { ferm_rate: getOverrideOrDefault(rows[i], 'ferm_rate') }
      break
    }
  }
  return r
}

function getInitialCurrencyDateRange(year: number) {
  const start = `${year}-01-01`
  const end = `${year}-07-01`
  return { end, start }
}

function formatCurrencyDateRangeForHeader(dateRange: {
  end: string
  start: string
}) {
  const { end, start } = dateRange
  let result = ''
  if (start && end) {
    const sameYear = start.split('-')[0] === end.split('-')[0]
    const strStart = sameYear
      ? formatIso8601DateString(start).split(' ').slice(0, 2).join(' ')
      : formatIso8601DateString(start)
    const strEnd = formatIso8601DateString(end)
    result = `${strStart} - ${strEnd}`
  } else if (start) {
    result = formatIso8601DateString(start)
  } else if (end) {
    result = formatIso8601DateString(end)
  }
  return result
}

function revertAllCurrencyNames(rows: SAContribution[], value: any) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === value) {
      delete rows[i]['override_ferm_cur']
      delete rows[i]['override_ferm_rate']
    }
  }
}

function revertAllCurrencyRates(rows: SAContribution[], name: string) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === name) {
      delete rows[i]['override_ferm_rate']
    }
  }
}

function updateAllCurrencyNames(
  rows: SAContribution[],
  oldValue: string,
  newValue: string,
) {
  for (let i = 0; i < rows.length; i++) {
    if (getOverrideOrDefault(rows[i], 'ferm_cur') === oldValue) {
      rows[i]['override_ferm_cur'] = newValue
    }
  }
}

function updateAllCurrencyRates(
  rows: SAContribution[],
  name: string,
  newValue: Big,
) {
  if (name !== null && name !== '') {
    for (let i = 0; i < rows.length; i++) {
      if (getOverrideOrDefault(rows[i], 'ferm_cur') === name) {
        rows[i]['override_ferm_rate'] = newValue
      }
    }
  }
}

function SAView(props: SAViewProps) {
  const { period } = props

  const ctx = useContext(ReplenishmentContext)
  const ctxSoA = useContext(SoAContext)
  const version = ctxSoA.version
  const versions = ctxSoA.versions

  const isTreasurer = ctx.isTreasurer
  const isFinal = version?.is_final ?? true
  const isNewestVersion = version?.version === versions[0]?.version

  const isEditable = isTreasurer && !isFinal && isNewestVersion

  const contributions = useMemo(
    function () {
      return transformContributions(ctxSoA.contributions)
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
      if (ctxSoA.replenishment) {
        setReplenishmentAmount(
          asDecimal(ctxSoA.replenishment.amount).toString(),
        )
      }
    },
    [contributions, ctxSoA.replenishment],
  )

  const [tableData, setTableData] = useState(contributions)

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState<SortDirection>(1)

  const [showAdd, setShowAdd] = useState(false)

  const [replenishmentAmount, setReplenishmentAmount] = useState('')
  const [unusedAmount, setUnusedAmount] = useState('')

  const annualBudget = useMemo(
    () =>
      asDecimal(replenishmentAmount)
        .minus(asDecimal(unusedAmount))
        .div(asDecimal('3')),
    [replenishmentAmount, unusedAmount],
  )

  const [commentText, setCommentText] = useState<string>('')

  function handleNewTableData(newData: SAContribution[]) {
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
    () => computeTableData(tableData, annualBudget),
    /* eslint-disable-next-line */
    [tableData, replenishmentAmount, unusedAmount],
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

  function handleAddSubmit(country: Country) {
    const entry: SAContribution = {
      avg_ir: null,
      country: country.name_alt,
      country_id: country.id,
      ferm_cur: '',
      ferm_rate: null,
      isNew: true,
      iso3: country.iso3,
      opted_for_ferm: null,
      qual_ferm: false,
      un_soa: asDecimal('0.0'),
    }
    setTableData((prev) => [entry, ...prev])
    setShowAdd(false)
  }

  function handleDelete(idx: number) {
    const confirmed = confirm('Are you sure you want to delete this entry?')
    if (confirmed) {
      const next: SAContribution[] = []
      for (let i = 0; i < sortedData.length; i++) {
        if (i !== idx) {
          next.push(sortedData[i])
        }
      }
      setTableData(next)
    }
  }

  const handleAmountInput: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setReplenishmentAmount(evt.target.value)
  }

  const handleUnusedAmountInput: ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) => {
    setUnusedAmount(evt.target.value)
  }

  function handleSort(column: number) {
    setSortDirection(
      (direction) => (column === sortOn ? -direction : 1) as SortDirection,
    )
    setSortOn(column)
  }

  function handleCellEdit(
    r: number,
    c: number,
    n: keyof SAContribution,
    v: any,
  ) {
    const parser = columns[c].parser
    const overrideKey = `override_${n}` as keyof SAContribution
    const prevValue = getOverrideOrDefault(sortedData[r], n)
    const next: Record<string, any>[] = [...sortedData]
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
      } else if (prevValue === null || prevValue === '') {
        next[r][overrideKey] = value
      } else {
        updateAllCurrencyNames(
          next as SAContribution[],
          getOverrideOrDefault(sortedData[r], n) as string,
          value,
        )
      }
    } else if (n === 'ferm_rate') {
      if (isNullValue) {
        next[r][overrideKey] = null
      } else if (prevValue === null) {
        next[r][overrideKey] = value
      }
      updateAllCurrencyRates(
        next as SAContribution[],
        getOverrideOrDefault(sortedData[r], 'ferm_cur') as string,
        value,
      )
    } else if (isNullValue) {
      next[r][overrideKey] = null
    } else if (next[r][n] === value) {
      delete next[r][overrideKey]
    } else {
      next[r][overrideKey] = value
    }

    if (n === 'avg_ir') {
      const qualifiesForFerm = checkQualifiesForFerm(next[r] as SAContribution)
      next[r].qual_ferm = qualifiesForFerm
      if (qualifiesForFerm) {
        next[r].override_opted_for_ferm = qualifiesForFerm
      } else {
        delete next[r]['override_opted_for_ferm']
        next[r].opted_for_ferm = null
      }
    }

    setTableData(next as SAContribution[])
  }

  function handleCellRevert(r: number, n: keyof SAContribution) {
    const overrideKey = `override_${n}` as keyof SAContribution
    const next = [...sortedData]

    if (n === 'ferm_cur') {
      revertAllCurrencyNames(
        next,
        getOverrideOrDefault(sortedData[r], 'ferm_cur'),
      )
    } else if (n === 'ferm_rate') {
      revertAllCurrencyRates(
        next,
        getOverrideOrDefault(sortedData[r], 'ferm_cur') as string,
      )
    } else {
      delete next[r][overrideKey]
    }
    setTableData(next)
  }

  const handleCommentInput: ChangeEventHandler<HTMLTextAreaElement> = (evt) => {
    setCommentText(evt.target.value)
  }

  function handleChangeCurrencyDateRange(start: string, end: string) {
    setCurrencyDateRange({
      end: end,
      start: start,
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4 py-4 print:hidden">
          <div className="flex items-center gap-x-4 py-4">
            <div className="flex flex-col gap-y-2 2xl:flex-row 2xl:items-center">
              <label className="pl-4 2xl:pl-0" htmlFor="triannualBudget_mask">
                <div className="flex flex-col uppercase text-primary">
                  <span className="font-bold">Triannual budget</span>
                  <span className="">(in USD)</span>
                </div>
              </label>
              <FormattedNumberInput
                id="triannualBudget"
                className="w-36"
                disabled={!isEditable}
                value={replenishmentAmount}
                onChange={handleAmountInput}
              />
            </div>
            <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
            <div className="flex flex-col gap-y-2 2xl:flex-row 2xl:items-center">
              <label className="pl-4 2xl:pl-0" htmlFor="triannualBudget_mask">
                <div className="flex flex-col uppercase text-primary">
                  <span className="font-bold">Previously unused sum</span>
                  <span className="">(in USD)</span>
                </div>
              </label>
              <FormattedNumberInput
                id="previouslyUnusedSum"
                className="w-36"
                disabled={!isEditable}
                value={unusedAmount}
                onChange={handleUnusedAmountInput}
              />
            </div>
            <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400"></div>
            <div className="flex flex-col gap-y-2 2xl:flex-row 2xl:items-center">
              <label className="pl-4 2xl:pl-0" htmlFor="totalAmount_mask">
                <div className="flex flex-col uppercase text-primary">
                  <span className="font-bold">Annual budget</span>
                  <span className="">(in USD)</span>
                </div>
              </label>
              <FormattedNumberInput
                id="totalAmount"
                className="w-36"
                value={annualBudget.toString()}
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="h-8 border-y-0 border-l border-r-0 border-solid border-gray-400 sm:hidden 2xl:block"></div>
          <div className="flex flex-col gap-y-2 2xl:flex-row 2xl:items-center">
            <label className="pl-4 2xl:pl-0">
              <div className="flex flex-col uppercase text-primary">
                <span className="max-w-28 font-bold">
                  Currency rate date range
                </span>
              </div>
            </label>
            <DateRangeInput
              disabled={!isEditable}
              initialEnd={currencyDateRange.end}
              initialStart={currencyDateRange.start}
              onChange={handleChangeCurrencyDateRange}
            />
          </div>
        </div>
        <SaveManager
          comment={commentText}
          currencyDateRange={currencyDateRange}
          data={transformForSave(tableData)}
          replenishmentAmount={replenishmentAmount}
          replenishmentId={ctxSoA.replenishment?.id}
          version={version}
          versions={versions}
        />
      </div>
      <SATable
        adminButtons={isTreasurer}
        columns={columns}
        countriesForAdd={countriesForAdd}
        enableEdit={isEditable}
        enableSort={true}
        rowData={formattedTableData}
        showAdd={showAdd}
        sortDirection={sortDirection}
        sortOn={sortOn}
        extraRows={formatTableData([
          {
            country: 'Total',
            ...sumColumns(computedData),
          } as unknown as SAContribution,
        ])}
        onAddCancel={() => setShowAdd(false)}
        onAddSubmit={handleAddSubmit}
        onCellEdit={handleCellEdit}
        onCellRevert={handleCellRevert}
        onDelete={handleDelete}
        onSort={handleSort}
      />
      {!showAdd && isTreasurer ? (
        <div className="flex items-center py-4 print:hidden">
          <AddButton onClick={showAddRow}>Add country</AddButton>
        </div>
      ) : null}
      <div id="sa-footnotes">
        <p>
          <sup>*</sup> Data extracted from{' '}
          <Link
            href="https://documents.un.org"
            rel="noopener noreferrer nofollow"
            target="_blank"
          >
            UN Contribution website
          </Link>
          .
        </p>
        <p>
          <sup>**</sup> Average inflation obtained from{' '}
          <Link
            href="https://www.imf.org/en/Publications/SPROLLs/world-economic-outlook-databases"
            rel="noopener noreferrer nofollow"
            target="_blank"
          >
            IMF website
          </Link>
          .
        </p>
        <p>
          <sup>***</sup> Data extracted from{' '}
          <Link
            href="https://treasury.un.org/operationalrates/OpRatesExport.php"
            rel="noopener noreferrer nofollow"
            target="_blank"
          >
            UN Treasury
          </Link>
          .
        </p>
      </div>
      {isTreasurer && (
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
      )}
    </>
  )
}

function SAViewWrapper(props: SAViewWrapperProps) {
  // Wrapper used to avoid flicker when no period is given.
  const { period, ...rest } = props

  const soaCtx = useContext(SoAContext)

  const saView = period ? (
    <SAView period={period} {...rest} />
  ) : (
    <div className="h-screen"></div>
  )

  return (
    <>
      <DownloadButtons
        downloadTexts={['Download']}
        downloadUrls={[
          formatApiUrl(
            `/api/replenishment/scales-of-assessment/export/?start_year=${soaCtx?.replenishment?.start_year}&version=${soaCtx?.version?.version}`,
          ),
        ]}
      />
      {saView}
    </>
  )
}

export default SAViewWrapper
