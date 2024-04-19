import type { ITableProps } from '../../../CountryProgramme/typesCPView'
import { CPReport } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import { useRef, useState } from 'react'

import { Alert, Checkbox, FormControlLabel } from '@mui/material'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import SectionC, { DeserializedDataC } from '@ors/models/SectionC'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export type RowData = DeserializedDataC & {
  count?: number
  id?: number
  rowType?: string
  tooltip?: boolean
}

function getRowData(
  report: any,
  model: string,
  showOnlyReported: boolean,
): RowData[] {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []

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
      [{ display_name: group, group, rowType: 'group' }],
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

export default function SectionCView(props: {
  TableProps: ITableProps & {
    context: {
      section: SectionC['data']
      variant: ReportVariant
    }
    report: CPReport
    section: SectionC['data']
  }
  report: CPReport
  variant: ReportVariant
}) {
  const { TableProps, report, variant } = props
  const gridOptions = useGridOptions({
    model: variant.model,
  })
  const grid = useRef<any>()
  const [showOnlyReported, setShowOnlyReported] = useState(false)
  const rowData = getRowData(report, variant.model, showOnlyReported)

  return (
    <>
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
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
    </>
  )
}
