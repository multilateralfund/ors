import React, { useState } from 'react'

import { Alert, Typography } from '@mui/material'
import { groupBy, map } from 'lodash'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: any, rows: any) {
  const dataByRowId = groupBy(report.adm_b, 'row_id')

  return map(rows, (row) => ({
    values: dataByRowId[row.id]?.[0]?.values || [],
    ...row,
    ...(row.type === 'title' ? { rowType: 'group' } : {}),
    ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
  }))
}

export default function AdmB(props: any) {
  const { TableProps, emptyForm, report, variant } = props
  const { columns = [], rows = [] } = emptyForm.adm_b || {}
  const gridOptions = useGridOptions({
    adm_columns: columns,
    model: variant.model,
  })
  const [rowData] = useState(() => getRowData(report, rows))

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Typography id="footnote-1" className="transition-all">
          <span className="font-bold">1. </span>
          If Yes, since when (Date) / If No, planned date.
        </Typography>
      </Alert>
      <SimpleTable
        {...TableProps}
        className="two-groups"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        rowData={rowData}
      />
    </>
  )
}
