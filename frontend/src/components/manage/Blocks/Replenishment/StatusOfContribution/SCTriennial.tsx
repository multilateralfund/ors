'use client'
import { useMemo, useState } from 'react'

import { TriennialIndicators } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/Indicators'
import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import { sortTableData } from '@ors/components/manage/Blocks/Replenishment/utils'

import { SortDirection } from '../Table/types'
import { TriennialContributions } from './types'

function fiddleColumns(
  columns: typeof SC_COLUMNS,
  showOutstandingExplanation: boolean,
) {
  const result = new Array(columns.length)
  for (let i = 0; i < result.length; i++) {
    result[i] = { ...columns[i] }
    if (showOutstandingExplanation) {
      if (result[i].field === 'outstanding_contributions') {
        result[i].label = result[i].label + ' **'
      }
    }
  }
  return result
}

export default function SCTriennial({ period }: { period: string }) {
  const [year_start, year_end] = period.split('-')
  const { data, extraRows, rows } = useGetSCData(year_start, year_end)

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState<SortDirection>(1)

  const curYear = new Date().getFullYear()

  const showOutstandingExplanation = curYear < parseInt(year_end, 10)
  let outstandingExplanation = ''

  if (curYear == parseInt(year_start, 10)) {
    outstandingExplanation = `Only the year ${year_start} is considered for the Outstanding contributions.`
  } else if (showOutstandingExplanation) {
    outstandingExplanation = `Only the years ${year_start} - ${curYear} are considered for the Outstanding contributions`
  }

  const sortedData = useMemo(
    function () {
      return sortTableData(rows, SC_COLUMNS[sortOn].field, sortDirection)
    },
    [rows, sortOn, sortDirection],
  )

  function handleSort(column: number) {
    setSortDirection(
      (direction) => (column === sortOn ? -direction : 1) as SortDirection,
    )
    setSortOn(column)
  }

  const indicatorsData: TriennialContributions = useMemo(() => {
    return rows.reduce(
      (acc, { outstanding_contributions }) => {
        let value = outstanding_contributions
        if (value > -1 && value < 1) {
          value = 0
        }
        if (value <= 0) {
          acc.contributions += 1
        }
        return acc
      },
      {
        contributions: 0,
      },
    )
  }, [rows])

  const totalPledge = useMemo(() => {
    const cashPayments = Number(data?.total?.cash_payments) || 0
    const bilateralAssistance = Number(data?.total?.bilateral_assistance) || 0
    const promissoryNotes = Number(data?.total?.promissory_notes) || 0
    const agreedContributions = Number(data?.total?.agreed_contributions) || 1
    const total =
      ((cashPayments + bilateralAssistance + promissoryNotes) /
        agreedContributions) *
      100
    return total.toLocaleString('en-US', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  }, [data])

  const tableColumns = fiddleColumns(SC_COLUMNS, showOutstandingExplanation)

  return (
    <div className="flex flex-col items-start gap-6">
      <TriennialIndicators
        data={indicatorsData}
        period={period}
        totalPledge={totalPledge}
      />
      <Table
        adminButtons={false}
        columns={tableColumns}
        enableSort={true}
        extraRows={formatTableRows(extraRows)}
        rowData={formatTableRows(sortedData)}
        sortDirection={sortDirection}
        sortOn={sortOn}
        textPosition="center"
        onSort={handleSort}
      />
      <div className="w-full lg:max-w-[50%]">
        <p>
          <sup>*</sup> Additional amount on disputed contributions from the
          United States of America.
        </p>
        {showOutstandingExplanation ? (
          <p>
            <sup>**</sup> {outstandingExplanation}
          </p>
        ) : null}
      </div>
    </div>
  )
}
