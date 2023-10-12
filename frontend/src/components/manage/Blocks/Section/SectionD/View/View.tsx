import { useMemo, useRef } from 'react'

import { Typography } from '@mui/material'
import dynamic from 'next/dynamic'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionDView(props: any) {
  const { TableProps, index, report, setActiveSection } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()

  const rowData = useMemo(() => {
    const rowData = (report.section_d || []).map((item: any) => ({
      ...item,
      group: item.group || 'Other',
    }))

    return rowData
  }, [report])

  return (
    <>
      <Table
        {...TableProps}
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        rowData={rowData}
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!rowData.length) {
            setActiveSection(index)
          }
        }}
      />
      <Typography className="italic" variant="body2">
        1. Amounts of HFC-23 captured for destruction or feedstock use will not
        be counted as production as per Article 1 of the Montreal Protocol.
      </Typography>
    </>
  )
}
