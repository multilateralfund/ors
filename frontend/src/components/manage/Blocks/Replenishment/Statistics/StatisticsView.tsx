'use client'

import React from 'react'

import cx from 'classnames'

import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'

import useGetDashboardData from '../Dashboard/useGetDashboardData'
import styles from '../Table/table.module.css'
import useGetStatisticsData, { SoCStatistic } from './useGetStatisticsData'

interface HeaderDefinition {
  field: keyof SoCStatistic
  headerClass?: string
  isPercentage?: boolean
  label: string
  rowClass?: string
  skipFormatting?: boolean
}

const EMPTY_ROW: HeaderDefinition = {
  field: '' as keyof SoCStatistic,
  label: '\u00a0',
  rowClass: '*:border-none',
}

const HEADERS: HeaderDefinition[] = [
  { field: 'period', label: 'Description', skipFormatting: true },
  { field: 'agreed_contributions', label: 'Pledged contributions' },
  { field: 'cash_payments', label: 'Cash payments/received' },
  { field: 'bilateral_assistance', label: 'Bilateral assistance' },
  { field: 'promissory_notes', label: 'Promissory notes' },
  {
    field: 'total_payments',
    headerClass: 'font-bold',
    label: 'Total payments',
  },
  { field: 'disputed_contributions', label: 'Disputed contributions' },
  { field: 'outstanding_contributions', label: 'Outstanding pledges' },
  {
    field: 'payment_pledge_percentage',
    isPercentage: true,
    label: 'Payments %age to pledges',
  },
  EMPTY_ROW,
  {
    field: 'interest_earned',
    headerClass: 'font-bold',
    label: 'Interest earned',
  },
  EMPTY_ROW,
  {
    field: 'miscellaneous_income',
    headerClass: 'font-bold',
    label: 'Miscellaneous income',
  },
  EMPTY_ROW,
  { field: 'total_income', headerClass: 'font-bold', label: 'TOTAL INCOME' },
  EMPTY_ROW,

  {
    field: 'period',
    headerClass: 'font-bold',
    label: 'Accumulated figures',
    rowClass: 'font-bold',
    skipFormatting: true,
  },
  { field: 'agreed_contributions', label: 'Total pledges' },
  {
    field: 'total_payments',
    headerClass: 'font-bold',
    label: 'Total payments',
  },
  {
    field: 'payment_pledge_percentage',
    isPercentage: true,
    label: 'Payments %age to pledges',
  },
  { field: 'total_income', label: 'Total income' },
  {
    field: 'outstanding_contributions',
    label: 'Total outstanding contributions',
  },
  {
    field: 'outstanding_contributions_percentage',
    isPercentage: true,
    label: 'As % to total pledges',
  },
  {
    field: 'outstanding_ceit',
    label:
      'Outstanding contributions for certain Countries with Economies in Transition (CEITs)',
  },
  {
    field: 'percentage_outstanding_ceit',
    isPercentage: true,
    label: "CEITs' outstanding %age to pledges",
  },
]

function StatisticsTable(props: { data: SoCStatistic[] }) {
  const { data } = props

  const header: React.JSX.Element[] = []
  const rows: React.JSX.Element[] = []

  for (let i = 0; i < HEADERS.length; i++) {
    const cells = []
    const collection = i == 0 ? header : rows

    if (i == 0) {
      cells.push(
        <th key="header" className="print:w-32">
          {HEADERS[i].label}
        </th>,
      )
    } else {
      cells.push(
        <td key="header" className={cx('text-left', HEADERS[i].headerClass)}>
          {HEADERS[i].label}
        </td>,
      )
    }

    for (let j = 0; j < data.length; j++) {
      const content = data[j][HEADERS[i].field]
      let cellValue = ''
      if (content !== null && !HEADERS[i]?.skipFormatting) {
        cellValue = formatNumberValue(content, 2, 2) || ''
      } else if (content !== null && HEADERS[i]?.skipFormatting) {
        cellValue = content.toString()
      } else if (HEADERS[i]?.skipFormatting) {
        cellValue = ''
      } else {
        cellValue = formatNumberValue(0, 2, 2) || ''
      }
      if (HEADERS[i]?.isPercentage ?? false) {
        cellValue = `${cellValue}%`
      }
      if (i == 0) {
        cells.push(<th key={j}>{cellValue}</th>)
      } else {
        cells.push(<td key={j}>{cellValue}</td>)
      }
    }

    collection.push(
      <tr key={i} className={cx(HEADERS[i].rowClass)}>
        {cells}
      </tr>,
    )
  }

  return (
    <table className={cx(styles.replTable, 'print:text-xs')}>
      <thead>{header}</thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

function StatisticsView() {
  const { newData } = useGetDashboardData()
  const { asOfDate } = newData

  const { data } = useGetStatisticsData()

  return (
    <>
      <h2 className="flex shrink flex-wrap items-center gap-1">
        <span className="whitespace-normal">
          Statistics as of {asOfDate} (USD)
        </span>
      </h2>
      <div className="mt-8 print:mt-0">
        {data ? <StatisticsTable data={data} /> : null}
      </div>
    </>
  )
}

export default StatisticsView
