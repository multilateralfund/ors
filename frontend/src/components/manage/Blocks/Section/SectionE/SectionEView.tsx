import { useRef } from 'react'

import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionEView(props: {
  report: Record<string, Array<any>>
}) {
  const grid = useRef<any>()
  const { report } = props

  const { results } = getResults(report.section_e)

  const gridOptions = useGridOptions()

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
        rowData={results}
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
