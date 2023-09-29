import { useEffect, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import cx from 'classnames'
import { groupBy, map, times } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

import useGridOptions from './schemaView'

export default function AdmC(props: {
  admForm: Record<string, any>
  report: Record<string, Array<any>>
  variant: any
}) {
  const { admForm, report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({ model: variant.model })
  const [loadTable, setLoadTable] = useState(false)
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    const dataByRowId = groupBy(report.adm_c, 'row_id')

    return map(admForm.admC?.rows, (row) => ({
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
    }))
  }, [admForm, report])

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
          C. Quantitative assessment of the phase-out programme
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
          className={cx('two-groups', { 'opacity-0': loading })}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
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
            'ag-row-hashed': (props) => props.data.rowType === 'hashed',
          }}
          onFirstDataRendered={() => setLoading(false)}
          withSeparators
        />
      )}
    </>
  )
}
