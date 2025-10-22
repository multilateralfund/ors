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
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

function getRowData(report: CPReport): SectionDRowData[] {
  return (report.section_d || []).map((item) => ({
    ...item,
  }))
}

export default function SectionDView(props: SectionDViewProps) {
  const { Comments, TableProps, report, showComments, variant } = props
  const gridOptions = useGridOptions({ model: variant.model })
  const grid = useRef<any>()
  const [rowData] = useState<SectionDRowData[]>(() => getRowData(report))

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        {shouldEnableNewCPDataFormatting(variant.model) ? (
          <Footnotes />
        ) : (
          <Footnote id="" index="">
            Data in Section D should be provided (if applicable) even if
            breakdown in Section E by enterprises are not reported as reporting
            under Section E is voluntary for the shaded column
          </Footnote>
        )}
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
