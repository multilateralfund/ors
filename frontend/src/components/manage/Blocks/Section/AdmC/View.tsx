import { useMemo, useRef } from 'react'

import { groupBy, map } from 'lodash'
import dynamic from 'next/dynamic'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function AdmC(props: any) {
  const { TableProps, emptyForm, index, report, setActiveSection } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    adm_columns: emptyForm.adm_c.columns,
  })

  const rowData = useMemo(() => {
    const dataByRowId = groupBy(report.adm_c, 'row_id')

    return map(emptyForm.adm_c?.rows, (row) => ({
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
    }))
  }, [emptyForm, report])
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
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!rowData.length) {
            setActiveSection(index)
          }
        }}
      />
    </>
  )
}
