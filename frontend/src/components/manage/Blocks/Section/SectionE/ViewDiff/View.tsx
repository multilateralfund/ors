import React, { useRef, useState } from 'react'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getRowData(report: any) {
  return [...report.section_e]
}

export default function SectionEViewDiff(props: any) {
  const { TableProps, report } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report))

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        rowData={rowData}
      />
    </>
  )
}
