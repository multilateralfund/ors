import { ApiCPReport } from '@ors/types/api_country-programme_records'

import React, { useRef, useState } from 'react'

import { Alert, Checkbox, FormControlLabel } from '@mui/material'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import { SectionCRowData, SectionCViewProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

function getRowData(
  report: ApiCPReport,
  variant: ReportVariant,
  showOnlyReported: boolean,
): SectionCRowData[] {
  let rowData: SectionCRowData[] = []
  const dataByGroup: Record<string, any> = {}
  const groups: string[] = []

  let data = report.section_c
  if (showOnlyReported) {
    data = data.filter((item: any) => item.id !== 0)
  }
  each(data, (item) => {
    const group = item.group || 'Alternatives'
    if (!dataByGroup[group]) {
      dataByGroup[group] = []
    }
    if (!includes(groups, group)) {
      groups.push(group)
    }
    dataByGroup[group].push({ ...item, group })
  })
  each(groups, (group: string) => {
    rowData = union(
      rowData,
      [{ display_name: group, group, row_id: group, rowType: 'group' }],
      dataByGroup[group],
      variant.match([CPModel.IV]) && group === 'Alternatives'
        ? [
            {
              display_name: 'Other alternatives (optional):',
              group,
              mandatory: false,
              row_id: 'other_alternatives',
              rowType: 'hashed',
            },
          ]
        : [],
    )
  })
  return rowData
}

export default function SectionCView(props: SectionCViewProps) {
  const { Comments, TableProps, report, showComments, variant } = props
  const gridOptions = useGridOptions({
    variant: variant,
  })
  const grid = useRef<any>()
  const [showOnlyReported, setShowOnlyReported] = useState(false)
  const rowData = getRowData(report, variant, showOnlyReported)

  return (
    <>
      {variant.match([CPModel.II, CPModel.III]) ? null : (
        <Alert
          className="bg-mlfs-bannerColor"
          icon={<IoInformationCircleOutline size={24} />}
          severity="info"
        >
          <Footnotes />
        </Alert>
      )}
      <div className="flex justify-end">
        <FormControlLabel
          label="Show only reported substances"
          control={
            <Checkbox
              checked={showOnlyReported}
              onChange={(event) => setShowOnlyReported(event.target.checked)}
            />
          }
        />
      </div>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        rowData={rowData}
      />
      {showComments && <Comments section="section_c" viewOnly={false} />}
    </>
  )
}
