import React, { useState } from 'react'

import { Alert } from '@mui/material'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import Footnote from '@ors/components/ui/Footnote/Footnote'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: any) {
  return [...report.section_e]
}

function getPinnedRowData(rowData: any) {
  return rowData.length > 0
    ? [{ facility: 'TOTAL', rowType: 'total', tooltip: true }]
    : []
}

export default function SectionEView(props: any) {
  const { Comments, TableProps, report, showComments } = props
  const gridOptions = useGridOptions()
  const [rowData] = useState(() => getRowData(report))
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnote id="" index="">
          Facility name must be provided if data in Section D is provided
        </Footnote>
        <Footnotes />
      </Alert>
      <SimpleTable
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        rowData={[...rowData, ...pinnedBottomRowData]}
      />
      {showComments && <Comments section="section_e" viewOnly={false} />}
    </>
  )
}
