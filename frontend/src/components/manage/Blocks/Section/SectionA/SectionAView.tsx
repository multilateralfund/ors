import { useMemo, useRef } from 'react'

import { groupBy, union, uniq } from 'lodash'
import dynamic from 'next/dynamic'

import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionAView(props: {
  report: Record<string, Array<any>>
}) {
  const { report } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()

  const { results } = getResults(report.section_a)

  const groups = uniq(results.map((item) => item.annex_group || 'Other'))
  const resultsByGroup = groupBy(
    results.map((item) => ({
      ...item,
      annex_group: item.annex_group || 'Other',
      group: item.annex_group || 'Other',
    })),
    'group',
  )

  const rows = useMemo(() => {
    let data: Array<any> = []
    groups.forEach((annex_group) => {
      data = union(
        data,
        [{ chemical_name: annex_group, isGroup: true }],
        resultsByGroup[annex_group],
        [{ chemical_name: 'Sub-total', group: annex_group, isSubTotal: true }],
      )
    })
    if (data.length > 0) {
      data.push({ chemical_name: 'TOTAL', isTotal: true })
    }
    return data
  }, [groups, resultsByGroup])

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
