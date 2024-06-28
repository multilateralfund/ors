'use client'

import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import { SC_COLUMNS } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'

export default function SCAnnual({ year }) {
  const { extraRows, rows } = useGetSCData(year, year)
  return (
    <Table
      columns={SC_COLUMNS}
      enableEdit={false}
      enableSort={false}
      extraRows={extraRows}
      rowData={rows}
      textPosition="center"
    />
  )
}
