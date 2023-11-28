import { useMemo, useRef } from 'react'

import dynamic from 'next/dynamic'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionEView(props: any) {
  const { TableProps, index, report, setActiveSection } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()

  const rowData = useMemo(() => {
    const rowData = report.section_e
    return [...rowData]
  }, [report])

  const pinnedBottomRowData = useMemo(() => {
    return rowData.length > 0
      ? [{ facility: 'TOTAL', rowType: 'total', tooltip: true }]
      : []
  }, [rowData])

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        pinnedBottomRowData={pinnedBottomRowData}
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
