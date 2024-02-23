import { useRef, useState } from 'react'

import { Alert } from '@mui/material'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'
function getRowData(report: any) {
  return (report.section_d || []).map((item: any) => ({
    ...item,
    group: item.group || 'Other',
  }))
}

export default function SectionDView(props: any) {
  const { TableProps, report } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report))

  return (
    <>
      <Table
        {...TableProps}
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        rowData={rowData}
      />
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
    </>
  )
}
