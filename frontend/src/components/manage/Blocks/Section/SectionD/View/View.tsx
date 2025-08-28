import { CPReport } from '@ors/types/api_country-programme_records'

import React, { useRef, useState } from 'react'

import { Alert } from '@mui/material'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import Footnote from '@ors/components/ui/Footnote/Footnote'

import { IBaseSectionViewProps } from '../../types'
import { SectionDRowData, SectionDViewProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: CPReport): SectionDRowData[] {
  return (report.section_d || []).map((item) => ({
    ...item,
  }))
}

export default function SectionDView(props: SectionDViewProps) {
  const { Comments, TableProps, report, showComments } = props
  const gridOptions = useGridOptions()
  const grid = useRef<any>()
  const [rowData] = useState<SectionDRowData[]>(() => getRowData(report))

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnotes />
      </Alert>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        rowData={rowData}
      />
      {showComments && <Comments section="section_d" viewOnly={false} />}
    </>
  )
}
