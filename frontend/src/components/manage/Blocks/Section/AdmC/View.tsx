import { useEffect, useMemo, useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { groupBy, map, times } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function AdmC(props: {
  emptyForm: Record<string, any>
  exitFullScreen: () => void
  fullScreen: boolean
  report: Record<string, Array<any>>
  variant: any
}) {
  const { emptyForm, exitFullScreen, fullScreen, report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({ model: variant.model })
  const [loadTable, setLoadTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    const dataByRowId = groupBy(report.adm_c, 'row_id')

    return map(emptyForm.admC?.rows, (row) => ({
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
    }))
  }, [emptyForm, report])

  useEffect(() => {
    setTimeout(() => setLoadTable(true), 500)
  }, [])

  return (
    <>
      <HeaderTitle>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h3">
            {report.name}
          </Typography>
        )}
      </HeaderTitle>
      <Typography className="mb-4" component="h2" variant="h6">
        C. Quantitative assessment of the phase-out programme
      </Typography>
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
          withSeparators
        />
      )}
      {loadTable && (
        <Table
          className={cx('two-groups', {
            'full-screen': fullScreen,
            'opacity-0': loading,
          })}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout={fullScreen ? 'normal' : 'autoHeight'}
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
          withSeparators
        />
      )}
    </>
  )
}
