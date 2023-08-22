import { useMemo, useRef, useState } from 'react'

import { Box, Button } from '@mui/material'
import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'
import { ReportsSlice } from '@ors/slices/createReportsSlice'
import useStore from '@ors/store'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionA() {
  const grid = useRef<any>()
  const [showUsages, setShowUsages] = useState(false)
  const [rowData, setRowData] = useState<Array<Record<string, any>>>([])
  const reports: ReportsSlice = useStore((state) => state.reports)

  const substances = useMemo(() => {
    const { results } = getResults(reports.substances.data)
    return results
    // return results.filter((substance) => substance.sections.includes('A'))
  }, [reports])

  const gridOptions = useGridOptions({ showUsages, substances })

  return (
    <>
      <Box className="rounded-b-none border-b-0">
        <div id="section-control" className="text-right">
          <Button
            onClick={() => {
              setShowUsages(!showUsages)
            }}
          >
            Toggle usages
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setRowData([
                ...rowData,
                {
                  substance: { id: 0, formula: 'Select substance' },
                  usages: [{ quantity: 29 }, { quantity: 2.1 }],
                },
              ])
            }}
          >
            + Add substances
          </Button>
        </div>
      </Box>
      <Table
        className="three-groups rounded-t-none"
        animateRows={true}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        rowData={rowData}
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        onGridReady={() => {
          setShowUsages(true)
        }}
        withSeparators
      />
    </>
  )
}
