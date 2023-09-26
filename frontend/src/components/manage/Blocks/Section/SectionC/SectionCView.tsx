import { useMemo, useRef } from 'react'

import { groupBy, union, uniq } from 'lodash'
import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionCView(props: {
  report: Record<string, Array<any>>
}) {
  const grid = useRef<any>()
  const { report } = props

  const { results } = getResults(report.section_c)

  const groups = uniq(results.map((item) => item.annex_group || 'Other'))
  const resultsByGroup = groupBy(
    results.map((item) => ({
      ...item,
      annex_group: item.annex_group || 'Other',
    })),
    'annex_group',
  )

  const rows = useMemo(() => {
    let data: Array<any> = []
    groups.forEach((annex_group) => {
      data = union(
        data,
        [{ chemical_name: annex_group, isGroup: true }],
        resultsByGroup[annex_group],
        [{ chemical_name: 'Sub-total', isSubTotal: true }],
      )
    })
    if (data.length > 0) {
      data.push({ chemical_name: 'TOTAL', isTotal: true })
    }
    return data
  }, [groups, resultsByGroup])

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
        rowData={rows}
        suppressCellFocus={false}
        suppressNoRowsOverlay={true}
        suppressRowHoverHighlight={false}
        withSeparators
      />
    </>
  )
}
