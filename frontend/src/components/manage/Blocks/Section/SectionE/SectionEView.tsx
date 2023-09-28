import { useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { union } from 'lodash'
import dynamic from 'next/dynamic'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'
import { getResults } from '@ors/helpers/Api/Api'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionEView(props: {
  report: Record<string, Array<any>>
}) {
  const { report } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const { results } = getResults(report.section_e)
  const [loading, setLoading] = useState(true)

  const rows = useMemo(() => {
    return union(
      results,
      results.length > 0 ? [{ facility: 'TOTAL', isTotal: true }] : [],
    )
  }, [results])

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        <Typography className="text-white" component="h1" variant="h6">
          SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC
          TONNES)
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <Table
          className="two-groups"
          animateRows={true}
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          enableCellChangeFlash={true}
          enablePagination={false}
          gridRef={grid}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          rowData={rows}
          suppressCellFocus={false}
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
