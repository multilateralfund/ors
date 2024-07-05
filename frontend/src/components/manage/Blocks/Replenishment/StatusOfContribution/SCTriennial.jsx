'use client'

import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'

export default function SCTriennial({ period }) {
  const year_start = period.split('-')[0]
  const year_end = period.split('-')[1]
  const { extraRows, rows } = useGetSCData(year_start, year_end)

  return (
    <Table
      adminButtons={false}
      columns={SC_COLUMNS}
      enableEdit={false}
      enableSort={false}
      extraRows={formatTableRows(extraRows)}
      rowData={formatTableRows(rows)}
      textPosition="center"
    />
  )
}
