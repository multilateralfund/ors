import { useState } from 'react'

import { Box, Button } from '@mui/material'
import dynamic from 'next/dynamic'

import { gridOptions as options } from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionA() {
  const [gridOptions] = useState(options)
  const [rowData, setRowData] = useState<Array<Record<string, any>>>([])

  return (
    <>
      <Box className="rounded-b-none border-b-0">
        <div id="section-control" className="text-right">
          <Button
            variant="contained"
            onClick={() => {
              setRowData([
                ...rowData,
                {
                  exports: 0,
                  import_quotas: 0,
                  imports: 0,
                  production: 0,
                  substance: { id: 0, label: 'Select substance' },
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
        rowData={rowData}
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        // onCellEditingStarted={(event) => {
        //   console.log('onCellEditingStarted', event)
        // }}
        // onCellEditingStopped={(event) => {
        //   console.log('onCellEditingStopped', event)
        // }}
        withSeparators
      />
    </>
  )
}
