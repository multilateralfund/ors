import { useRef, useState } from 'react'

import { groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getRowData(report: any, rows: any) {
  const dataByRowId = groupBy(report.adm_c, 'row_id')

  return map(rows, (row) => ({
    values: dataByRowId[row.id]?.[0]?.values || [],
    ...row,
    ...(row.type === 'title' ? { rowType: 'group' } : {}),
    ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
  }))
}

export default function AdmC(props: any) {
  const { TableProps, emptyForm, report } = props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    adm_columns: columns,
  })
  const [rowData] = useState(() => getRowData(report, rows))

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        rowData={rowData}
      />
    </>
  )
}
