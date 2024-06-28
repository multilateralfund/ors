'use client'
import { useMemo } from 'react'

import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import { SC_COLUMNS } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'

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

  return (
    <Table
      columns={columns}
      enableEdit={false}
      enableSort={false}
      extraRows={extraRows}
      rowData={rows}
      textPosition="center"
    />
  )
}
