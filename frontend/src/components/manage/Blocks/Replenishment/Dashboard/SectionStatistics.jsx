'use client'

import cx from 'classnames'
import Link from 'next/link'

import { formatApiUrl } from '@ors/helpers'

import useGetBpPeriods from '../../BusinessPlans/BPList/useGetBPPeriods'
import styles from '../Table/table.module.css'

const HEADERS = [
  { field: 'period', label: 'Description' },
  { field: 'cash_payments', label: 'Cash payments/received' },
  { field: 'bilateral_assistance', label: 'Bilateral assistance' },
  { field: 'promissory_notes', label: 'Promissory notes' },
  { field: 'total_payments', label: 'Total payments' },
  { field: 'disputed_contributions', label: 'Disputed contributions' },
  { field: 'outstanding_contributions', label: 'Outstanding pledges' },
  {
    field: 'payments_percentage_to_pledges',
    label: 'Payments %age to pledges',
  },
  { field: '', label: '' },
  { field: 'interest_earned', label: 'Interest earned' },
  { field: '', label: '' },
  { field: 'miscellaneous_income', label: 'Miscellaneous income' },
  { field: '', label: '' },
  { field: 'total_income', label: 'TOTAL INCOME' },
  { field: '', label: '' },
  { field: 'accumulated_figures', label: 'Accumulated figures' },
  { field: 'acc_total_pledges', label: 'Total pledges' },
  { field: 'acc_total_payments', label: 'Total payments' },
  {
    field: 'acc_payments_percentage_to_pledges',
    label: 'Payments %age to pledges',
  },
  { field: 'total_income', label: 'Total income' },
  {
    field: 'total_outstanding_contributions',
    label: 'Total outstanding contributions',
  },
  { field: 'as_percentage_to_total_pledges', label: 'As % to total pledges' },
  {
    field: 'ceits_outstanding_contributions',
    label:
      'Outstanding contributions for certain Countries with Economies in Transition (CEITs)',
  },
  {
    field: 'ceits_outstanding_percentage_to_pledges',
    label: "CEITs' oustandings %age to pledges",
  },
]

const MOCK_DATA = [
  {
    acc_payments_percentage_to_pledges: 321.12,
    acc_total_payments: 321.12,
    acc_total_pledges: 321.12,
    accumulated_figures: 321.12,
    as_percentage_to_total_pledges: 321.12,
    bilateral_assistance: 123,
    cash_payments: 206611034.1,
    ceits_outstanding_contributions: 321.12,
    ceits_outstanding_percentage_to_pledges: 321.12,
    disputed_contributions: 123,
    interest_earned: 999.99,
    miscellaneous_income: 999.99,
    outstanding_contributions: 123,
    payments_percentage_to_pledges: 123,
    period: '1991-1993',
    promissory_notes: 123,
    total_income: 999.99,
    total_income: 321.12,
    total_outstanding_contributions: 321.12,
    total_payments: 123,
  },
]

function duplicateMockData() {
  const periods = [
    '1994-1996',
    '1997-1999',
    '2000-2002',
    '2003-2005',
    '2006-2008',
    '2009-2011',
    '2012-2014',
    '2015-2017',
    '2018-2020',
    '2021-2023',
    '2024-2026',
    '1991-2024',
  ]

  for (let i = 0; i < periods.length; i++) {
    MOCK_DATA[i + 1] = { ...MOCK_DATA[0], period: periods[i] }
  }
}

duplicateMockData()

function StatisticsTable(props) {
  const { data } = props

  const header = []
  const rows = []

  for (let i = 0; i < HEADERS.length; i++) {
    const cells = []
    const collection = i == 0 ? header : rows

    cells.push(
      <th key="header" className={cx({ 'text-left': i })}>
        {HEADERS[i].label}
      </th>,
    )

    for (let j = 0; j < data.length; j++) {
      const content = data[j][HEADERS[i].field]
      if (i == 0) {
        cells.push(<th key={j}>{content}</th>)
      } else {
        cells.push(<td key={j}>{content}</td>)
      }
    }

    collection.push(<tr key={i}>{cells}</tr>)
  }

  return (
    <table className={styles.replTable}>
      <thead>{header}</thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

function SectionStatistics() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          className="m-0 text-2xl text-primary no-underline print:hidden"
          href="./"
        >
          DASHBOARD
        </Link>{' '}
        <span className="print:hidden"> | </span>
        <Link
          className="m-0 text-2xl text-primary no-underline print:hidden"
          href="./status"
        >
          STATUS OF THE FUND
        </Link>{' '}
        <span className="print:hidden"> | </span>
        <h2 className="m-0 text-3xl">STATISTICS</h2>
      </div>
      <div>
        <Link
          href={formatApiUrl(
            '/api/replenishment/status-of-contributions/statistics-export/',
          )}
        >
          Download statistics
        </Link>
        <StatisticsTable data={MOCK_DATA} />
      </div>
    </>
  )
}

export default SectionStatistics
