import { useMemo, useRef } from 'react'

import { union } from 'lodash'
import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionDView(props: {
  report: Record<string, Array<any>>
}) {
  const { report } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()

  const { results } = getResults(report.section_d)

  const rows = useMemo(() => {
    return union(results, [{ chemical_name: 'TOTAL', isTotal: true }])
  }, [results])

  return (
    <>
      <Table
        animateRows={true}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        noRowsOverlayComponent={null}
        rowData={rows}
        suppressCellFocus={false}
        suppressNoRowsOverlay={true}
        suppressRowHoverHighlight={false}
        rowClassRules={{
          'ag-row-group': (props) => props.data.isGroup,
          'ag-row-sub-total': (props) => props.data.isSubTotal,
          'ag-row-total': (props) => props.data.isTotal,
        }}
        withSeparators
      />
    </>
  )
}
