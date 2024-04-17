import { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

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
      <Alert
        className="mb-4"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnotes />
      </Alert>
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
