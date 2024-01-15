import { useRef, useState } from 'react'

import { Typography } from '@mui/material'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

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
      <Typography className="italic" variant="body2">
        1. Amounts of HFC-23 captured for destruction or feedstock use will not
        be counted as production as per Article 1 of the Montreal Protocol.
      </Typography>
    </>
  )
}
