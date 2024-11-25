import { CPReport } from '@ors/types/api_country-programme_records'

import React, { useRef, useState } from 'react'

import { Alert } from '@mui/material'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import Footnote from '@ors/components/ui/Footnote/Footnote'

import { SectionEViewProps } from '../types'
import { SectionERowData } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: CPReport): SectionERowData[] {
  return [...report.section_e]
}

function getPinnedRowData(rowData: SectionERowData[]): SectionERowData[] {
  return rowData.length > 0
    ? [
        {
          facility: 'TOTAL',
          row_id: 'bottom_total',
          rowType: 'total',
          tooltip: true,
        },
      ]
    : []
}

export default function SectionEView(props: SectionEViewProps) {
  const { Comments, TableProps, report, showComments } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
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
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
      {showComments && <Comments section="section_e" viewOnly={false} />}
    </>
  )
}
