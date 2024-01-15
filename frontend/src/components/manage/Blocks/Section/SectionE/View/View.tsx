import { useRef, useState } from 'react'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getRowData(report: any) {
  return [...report.section_e]
}

function getPinnedRowData(rowData: any) {
  return rowData.length > 0
    ? [{ facility: 'TOTAL', rowType: 'total', tooltip: true }]
    : []
}

export default function SectionEView(props: any) {
  const { TableProps, report } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report))
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
