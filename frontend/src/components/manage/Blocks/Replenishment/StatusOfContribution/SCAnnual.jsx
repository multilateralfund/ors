'use client'
import { useMemo, useState } from 'react'

import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  SC_COLUMNS,
  formatTableRows,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import Table from '@ors/components/manage/Blocks/Replenishment/Table'
import { sortTableData } from '@ors/components/manage/Blocks/Replenishment/utils'

export default function SCAnnual({ year }) {
  const { extraRows, rows } = useGetSCData(year, year)

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

  return (
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
  )
}
