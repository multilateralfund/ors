import { useEffect, useMemo, useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { times, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schemaView'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionDView(props: {
  exitFullScreen: () => void
  fullScreen: boolean
  report: Record<string, Array<any>>
  variant: any
}) {
  const { exitFullScreen, fullScreen, report } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [loadTable, setLoadTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    const rowData = (report.section_d || []).map((item) => ({
      ...item,
      group: item.group || 'Other',
    }))

    return union(
      rowData,
      rowData.length > 0 ? [{ display_name: 'TOTAL', rowType: 'total' }] : [],
    )
  }, [report])

  useEffect(() => {
    setTimeout(() => setLoadTable(true), 500)
  }, [])

  return (
    <>
      <HeaderTitle>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h5">
            {report.name}
          </Typography>
        )}
        <Typography className="text-white" component="h1" variant="h6">
          SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC
          TONNES)
        </Typography>
      </HeaderTitle>
      {!loadTable && (
        <Table
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          enablePagination={false}
          rowData={times(10, () => {
            return {
              rowType: 'skeleton',
            }
          })}
          withFluidEmptyColumn
          withSeparators
        />
      )}
      {loadTable && (
        <Table
          className={cx({
            'full-screen': fullScreen,
            'opacity-0': loading,
          })}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout="normal"
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          rowData={rowData}
          suppressCellFocus={false}
          suppressRowHoverHighlight={false}
          HeaderComponent={
            fullScreen
              ? () => {
                  return (
                    <IconButton
                      className="exit-fullscreen p-2 text-primary"
                      aria-label="exit fullscreen"
                      onClick={exitFullScreen}
                    >
                      <IoClose size={32} />
                    </IconButton>
                  )
                }
              : () => null
          }
          onFirstDataRendered={() => setLoading(false)}
          withFluidEmptyColumn
          withSeparators
        />
      )}
    </>
  )
}
