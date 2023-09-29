import { useEffect, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import cx from 'classnames'
import { times, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schemaView'

export default function SectionDView(props: {
  report: Record<string, Array<any>>
  variant: any
}) {
  const { report } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [offsetHeight, setOffsetHeight] = useState(0)
  const [loadTable, setLoadTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    const rowData = (report.section_d || []).map((item) => ({
      ...item,
      group: item.annex_group || 'Other',
    }))

    return union(
      rowData,
      rowData.length > 0 ? [{ display_name: 'TOTAL', rowType: 'total' }] : [],
    )
  }, [report])

  const tableBodyHeight = useMemo(() => {
    const offset = offsetHeight
    const rowsVisible = 15
    const rowHeight = 41
    const rows = rowData.length
    if (!rows) {
      return 0
    }
    if (rows <= rowsVisible) {
      return rows * rowHeight + offset
    }
    return rowsVisible * rowHeight + offset
  }, [rowData, offsetHeight])

  function updateOffsetHeight() {
    const headerHeight = grid.current.getHeaderContainerHeight()
    const horizontalScrollbarHeight =
      grid.current.getHorizontalScrollbarHeight()
    setOffsetHeight(headerHeight + horizontalScrollbarHeight + 2)
  }

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
          enablePagination={false}
          rowData={times(10, () => {
            return {
              rowType: 'skeleton',
            }
          })}
          withSeparators
        />
      )}
      {loadTable && (
        <Table
          className={cx({ 'opacity-0': loading })}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout={tableBodyHeight > 0 ? 'normal' : 'autoHeight'}
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          rowBuffer={40}
          rowData={rowData}
          suppressCellFocus={false}
          suppressRowHoverHighlight={false}
          rowClassRules={{
            'ag-row-group': (props) => props.data.rowType === 'group',
            'ag-row-sub-total': (props) => props.data.rowType === 'subtotal',
            'ag-row-total': (props) => props.data.rowType === 'total',
          }}
          style={
            tableBodyHeight > 0
              ? {
                  height: tableBodyHeight,
                }
              : {}
          }
          onFirstDataRendered={() => setLoading(false)}
          onGridReady={updateOffsetHeight}
          withSeparators
        />
      )}
    </>
  )
}
