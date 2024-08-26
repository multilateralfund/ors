'use client'

import cx from 'classnames'
import Link from 'next/link'

import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import { formatApiUrl } from '@ors/helpers'

import useGetBpPeriods from '../../BusinessPlans/BPList/useGetBPPeriods'
import styles from '../Table/table.module.css'
import useGetStatisticsData from './useGetStatisticsData'

const HEADERS = [
  { field: 'period', label: 'Description' },
  { field: 'agreed_contributions', label: 'Pledged contributions' },
  { field: 'cash_payments', label: 'Cash payments/received' },
  { field: 'bilateral_assistance', label: 'Bilateral assistance' },
  { field: 'promissory_notes', label: 'Promissory notes' },
  { field: 'total_payments', label: 'Total payments' },
  { field: 'disputed_contributions', label: 'Disputed contributions' },
  { field: 'outstanding_contributions', label: 'Outstanding pledges' },
  {
    field: 'payment_pledge_percentage',
    label: 'Payments %age to pledges',
  },
  { field: '', label: '' },
  { field: 'interest_earned', label: 'Interest earned' },
  { field: '', label: '' },
  { field: 'miscellaneous_income', label: 'Miscellaneous income' },
  { field: '', label: '' },
  { field: 'total_income', label: 'TOTAL INCOME' },
  { field: '', label: '' },

  { field: 'period', label: 'Accumulated figures' },
  { field: 'agreed_contributions', label: 'Total pledges' },
  { field: 'total_payments', label: 'Total payments' },
  {
    field: 'payment_pledge_percentage',
    label: 'Payments %age to pledges',
  },
  { field: 'total_income', label: 'Total income' },
  {
    field: 'outstanding_contributions',
    label: 'Total outstanding contributions',
  },
  {
    field: 'outstanding_contributions_percentage',
    label: 'As % to total pledges',
  },
  {
    field: 'outstanding_ceit',
    label:
      'Outstanding contributions for certain Countries with Economies in Transition (CEITs)',
  },
  {
    field: 'percentage_outstanding_ceit',
    label: "CEITs' oustandings %age to pledges",
  },
]

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
      const cellValue = formatNumberValue(content, 2, 2) || content
      if (i == 0) {
        cells.push(<th key={j}>{cellValue}</th>)
      } else {
        cells.push(<td key={j}>{cellValue}</td>)
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
  const { data, loading } = useGetStatisticsData()
  console.log(data)
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
        {data ? <StatisticsTable data={data} /> : null}
      </div>
    </>
  )
}

export default SectionStatistics
