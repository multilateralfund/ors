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

export default function SCTriennial({ period }) {
  const [year_start, year_end] = period.split('-')
  const { data, extraRows, rows } = useGetSCData(year_start, year_end)

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const sortedData = useMemo(
    function () {
      return sortTableData(rows, SC_COLUMNS[sortOn].field, sortDirection)
    },
    [rows, sortOn, sortDirection],
  )

  function handleSort(column) {
    setSortDirection((direction) => (column === sortOn ? -direction : 1))
    setSortOn(column)
  }

  const indicatorsData = useMemo(() => {
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

  return (
    <div className="flex flex-col items-start gap-6">
      <TriennialIndicators
        data={indicatorsData}
        period={period}
        totalPledge={totalPledge}
      />
      <Table
        adminButtons={false}
        columns={SC_COLUMNS}
        enableEdit={false}
        enableSort={true}
        extraRows={formatTableRows(extraRows)}
        rowData={formatTableRows(sortedData)}
        sortDirection={sortDirection}
        sortOn={sortOn}
        textPosition="center"
        onSort={handleSort}
      />
    </div>
  )
}
