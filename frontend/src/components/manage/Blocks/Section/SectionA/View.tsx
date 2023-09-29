import { useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { each, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionAView(props: {
  report: Record<string, Array<any>>
  variant: any
}) {
  const { report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({ model: variant.model })
  const [offsetHeight, setOffsetHeight] = useState(0)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    const dataByGroup: Record<string, any> = {}
    const groups: Array<string> = []
    each(report.section_a, (item) => {
      const group = item.annex_group || 'Other'
      if (!dataByGroup[group]) {
        dataByGroup[group] = []
      }
      if (!includes(groups, group)) {
        groups.push(group)
      }
      dataByGroup[group].push(item)
    })
    each(groups, (group: string) => {
      rowData = union(
        rowData,
        [{ display_name: group, group, rowType: 'group' }],
        dataByGroup[group],
        [{ display_name: 'Sub-total', group, rowType: 'subtotal' }],
      )
    })
    return rowData
  }, [report])

  const pinnedBottomRowData = useMemo(() => {
    return rowData.length > 0
      ? [{ display_name: 'TOTAL', rowType: 'total' }]
      : []
  }, [rowData])

  const tableBodyHeight = useMemo(() => {
    let offset = offsetHeight
    const rowsVisible = 15
    const rowHeight = 41
    const rows = rowData.length + pinnedBottomRowData.length
    if (pinnedBottomRowData.length) {
      offset += 1
    }
    if (!rows) {
      return 0
    }
    if (rows <= rowsVisible) {
      return rows * rowHeight + offset
    }
    return rowsVisible * rowHeight + offset
  }, [rowData, pinnedBottomRowData, offsetHeight])

  function updateOffsetHeight() {
    const headerHeight = grid.current.getHeaderContainerHeight()
    const horizontalScrollbarHeight =
      grid.current.getHorizontalScrollbarHeight()
    setOffsetHeight(headerHeight + horizontalScrollbarHeight + 2)
  }

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h5">
            {report.name}
          </Typography>
        )}
        <Typography className="text-white" component="h2" variant="h6">
          {includes(['IV'], variant.model)
            ? 'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)'
            : 'A. Data on Controlled Substances (in METRIC TONNES)'}
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <Table
          className="three-groups"
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout={tableBodyHeight > 0 ? 'normal' : 'autoHeight'}
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          pinnedBottomRowData={pinnedBottomRowData}
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
          onGridReady={updateOffsetHeight}
          withSeparators
        />
      )}
    </>
  )
}
