import { useEffect, useMemo, useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { each, includes, times, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schemaView'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionAView(props: {
  emptyForm: Record<string, any>
  exitFullScreen: () => void
  fullScreen: boolean
  report: Record<string, Array<any>>
  variant: any
}) {
  const { emptyForm, exitFullScreen, fullScreen, report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    model: variant.model,
    usages: emptyForm.usage_columns || [],
  })
  const [loadTable, setLoadTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    let rowData: Array<any> = []
    const dataByGroup: Record<string, any> = {}
    const groups: Array<string> = []
    each(report.section_a, (item) => {
      const group = item.group || 'Other'
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
          {includes(['IV'], variant.model)
            ? 'SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)'
            : 'A. Data on Controlled Substances (in METRIC TONNES)'}
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
          className={cx('three-groups', {
            'full-screen': fullScreen,
            'opacity-0': loading,
          })}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout="normal"
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          headerDepth={3}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          pinnedBottomRowData={pinnedBottomRowData}
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
