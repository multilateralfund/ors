import { useState } from 'react'

import { groupBy, map } from 'lodash'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'

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
  const { TableProps, emptyForm, report, variant } = props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  const gridOptions = useGridOptions({
    adm_columns: columns,
    model: variant.model,
  })
  const [rowData] = useState(() => getRowData(report, rows))

  return (
    <>
      <SimpleTable
        {...TableProps}
        className="two-groups"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        rowData={rowData}
      />
    </>
  )
}
