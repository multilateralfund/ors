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
  const { data, extraRows, rows } = useGetSCData()

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
        percentage_total_paid_current_year:
          data.percentage_total_paid_current_year,
      },
    )
  }, [rows, data.percentage_total_paid_current_year])

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
      <div className="w-full lg:max-w-[50%]">
        <p>
          <sup>*</sup> The bilateral assistance recorded for Australia and
          Canada was adjusted following approvals at the 39th meeting and taking
          into consideration a reconciliation carried out by the Secretariat
          through the progress reports submitted to the 40th meeting to read US
          $1,208,219 and US $6,449,438 instead of US $1,300,088 and US
          $6,414,880 respectively.
        </p>
        <p>
          <sup>**</sup> In accordance with decisions VI/5 and XVI/39 of the
          meeting of the Parties to the Montreal Protocol, Turkmenistan has been
          reclassified as operating under Article 5 in 2004 and therefore its
          contribution of US $5,764 for 2005 should be disregarded.
        </p>
        <p>
          <sup>***</sup> Amount netted off from outstanding contributions and
          are shown here for records only.
        </p>
      </div>
    </div>
  )
}
