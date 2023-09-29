import { useEffect, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import cx from 'classnames'
import { each, includes, times, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schemaView'

function getGroupName(substance: any) {
  if (substance.blend_id) {
    return 'Blends (Mixture of Controlled Substances)'
  }
  return substance.annex_group || 'Other'
}

export default function SectionBView(props: {
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
    let rowData: Array<any> = []
    const dataByGroup: Record<string, any> = {}
    const groups: Array<string> = []
    each(report.section_b, (item) => {
      const group = getGroupName(item)
      if (!dataByGroup[group]) {
        dataByGroup[group] = []
      }
      if (!includes(groups, group)) {
        groups.push(group)
      }
      dataByGroup[group].push({ ...item, group })
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
        <Typography className="text-white" component="h2" variant="h6">
          SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)
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
          className={cx('three-groups', { 'opacity-0': loading })}
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
          onFirstDataRendered={() => setLoading(false)}
          onGridReady={updateOffsetHeight}
          withSeparators
        />
      )}
    </>
  )
}
