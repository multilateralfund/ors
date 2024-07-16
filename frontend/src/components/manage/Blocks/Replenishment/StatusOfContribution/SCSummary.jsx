'use client'
import { useMemo, useState } from 'react'

import { SummaryIndicators } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/Indicators'
import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import { sortTableData } from '@ors/components/manage/Blocks/Replenishment/utils'

const summary_columns = [
  ...SC_COLUMNS,
  {
    field: 'gain_loss',
    label: 'Exchange (Gain)/Loss',
    subLabel: '(negative amount = Gain)',
  },
]

export default function SCSummary() {
  const { extraRows, rows } = useGetSCData()

  const [sortOn, setSortOn] = useState(0)
  const [sortDirection, setSortDirection] = useState(1)

  const columns = useMemo(function () {
    const result = []
    for (let i = 0; i < summary_columns.length; i++) {
      const Label = (
        <div className="flex flex-col">
          <span>{summary_columns[i].label}</span>
          <span className="whitespace-nowrap text-sm font-normal">
            {summary_columns[i].subLabel}
          </span>
        </div>
      )
      result.push({
        ...summary_columns[i],
        label: Label,
      })
    }
    return result
  }, [])

  const sortedData = useMemo(
    function () {
      return sortTableData(rows, summary_columns[sortOn].field, sortDirection)
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
        if (value < 0) {
          acc.contributions_advance += 1
        } else if (value === 0) {
          acc.contributions += 1
        } else {
          acc.outstanding_contributions += 1
        }
        return acc
      },
      {
        contributions: 0,
        contributions_advance: 0,
        outstanding_contributions: 0,
      },
    )
  }, [rows])

  return (
    <div className="flex flex-col items-start gap-6">
      <SummaryIndicators data={indicatorsData} />
      <Table
        adminButtons={false}
        columns={columns}
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
