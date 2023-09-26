import { useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { groupBy, union, uniq } from 'lodash'
import dynamic from 'next/dynamic'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
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
  const [results] = useState<Array<any>>(getResults(report.section_a).results)
  const [loading, setLoading] = useState(true)

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
      <HeaderTitle onInit={() => setLoading(false)}>
        <Typography className="text-white" component="h1" variant="h6">
          SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON
          CONTROLLED SUBSTANCES (METRIC TONNES)
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
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
      )}
    </>
  )
}
