import { useRef, useState } from 'react'

import { groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getRowData(report: any, rows: any) {
  const dataByRowId = groupBy(report.adm_c, 'row_id')

  return map(rows, (row) => ({
    values: dataByRowId[row.id]?.[0]?.values || [],
    ...row,
    ...(row.type === 'title'
      ? { row_id: `group_title_${row.index}`, rowType: 'group' }
      : {}),
    ...(row.type === 'subtitle'
      ? { row_id: `group_subtitle_${row.index}`, rowType: 'hashed' }
      : {}),
    ...(row.type === 'question'
      ? { row_id: `group_question_${row.index}` }
      : {}),
  }))
}

export default function AdmC(props: any) {
  const { TableProps, emptyForm, report, variant } = props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    adm_columns: columns,
    model: variant.model,
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
