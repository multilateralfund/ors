import { useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getRowData(report: any, rows: any) {
  const dataByRowId = groupBy(report.adm_b, 'row_id')

  return map(rows, (row) => ({
    values: dataByRowId[row.id]?.[0]?.values || [],
    ...row,
    ...(row.type === 'title' ? { rowType: 'group' } : {}),
    ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
  }))
}

export default function AdmB(props: any) {
  const { TableProps, emptyForm, report } = props
  const { columns = [], rows = [] } = emptyForm.adm_b || {}
  const gridOptions = useGridOptions({
    adm_columns: columns,
  })
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report, rows))

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        rowData={rowData}
      />
      <Typography id="footnote-1" className="italic" variant="body2">
        1. If Yes, since when (Date) / If No, planned date.
      </Typography>
    </>
  )
}
