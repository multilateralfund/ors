import { useRef } from 'react'

import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionDView(props: {
  report: Record<string, Array<any>>
}) {
  const grid = useRef<any>()
  const { report } = props

  const { results } = getResults(report.section_d)

  const gridOptions = useGridOptions()

  return (
    <>
      <Table
        className="three-groups rounded-t-none"
        animateRows={true}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        rowData={results}
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        withSeparators
      />
    </>
  )
}
