import { useRef, useState } from 'react'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionCView() {
  const params = useParams()
  const grid = useRef<any>()
  const [apiSettings] = useState({
    options: {
      params: {
        cp_report_id: params.report_id,
      },
    },
    path: `api/country-programme/records`,
  })
  const { data } = useApi(apiSettings)

  const { results } = getResults(data?.section_c)

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
