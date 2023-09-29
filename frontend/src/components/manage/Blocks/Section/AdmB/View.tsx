import { useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { map } from 'lodash'
import dynamic from 'next/dynamic'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'

import useGridOptions from './schemaView'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function AdmB(props: {
  admForm: Record<string, any>
  report: Record<string, Array<any>>
  variant: any
}) {
  const { admForm, report, variant } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions({ model: variant.model })
  const [loading, setLoading] = useState(true)

  const rowData = useMemo(() => {
    return map(admForm.admB?.rows, (row) => ({
      ...row,
      ...(row.type === 'title' ? { isGroup: true } : {}),
      ...(row.type === 'subtitle' ? { isStripe: true } : {}),
    }))
  }, [admForm])

  console.log('HERE', report, admForm)

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h5">
            {report.name}
          </Typography>
        )}
        <Typography className="text-white" component="h2" variant="h6">
          B. Regulatory, administrative and supportive actions
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <>
          <Table
            className="two-groups"
            columnDefs={gridOptions.columnDefs}
            defaultColDef={gridOptions.defaultColDef}
            enableCellChangeFlash={true}
            enablePagination={false}
            gridRef={grid}
            noRowsOverlayComponentParams={{ label: 'No data reported' }}
            rowBuffer={20}
            rowData={rowData}
            suppressCellFocus={false}
            suppressRowHoverHighlight={false}
            rowClassRules={{
              'ag-row-group': (props) => props.data.isGroup,
              'ag-row-stripe': (props) => props.data.isStripe,
            }}
            withSeparators
          />
        </>
      )}
    </>
  )
}
