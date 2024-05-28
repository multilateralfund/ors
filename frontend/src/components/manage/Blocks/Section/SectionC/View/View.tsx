import type { ITableProps } from '../../../CountryProgramme/typesCPView'
import { CPReport } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import React, { useState } from 'react'

import { Alert, Checkbox, FormControlLabel } from '@mui/material'
import { each, includes, union } from 'lodash'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import { SectionCViewProps } from '../types'
import { SectionCRowData } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(
  report: CPReport,
  model: string,
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
      ['IV'].includes(model) && group === 'Alternatives'
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
    model: variant.model,
  })
  const [showOnlyReported, setShowOnlyReported] = useState(false)
  const rowData = getRowData(report, variant.model, showOnlyReported)

  return (
    <>
      {includes(['II', 'III'], variant.model) ? null : (
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
      <SimpleTable
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        rowData={rowData}
      />
      {showComments && <Comments section="section_c" viewOnly={false} />}
    </>
  )
}
