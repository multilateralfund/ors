import type { TableProps } from '@ors/components/manage/Blocks/CountryProgramme/CPView'
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

function getRowData(report: any, model: string, showEmptyRows: boolean): RowData[] {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []

  let data = report.section_c
  if (!showEmptyRows) {
    data = data.filter((item) => item.id !== 0)
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
  TableProps: TableProps & {
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
  const [showEmptyRows, setShowEmptyRows] = useState(true)
  const [rowData] = useState(() => getRowData(report, variant.model, showEmptyRows))

  return (
    <>
      <div className="flex justify-end">
        {includes(['V'], variant.model) && (
          <FormControlLabel
            label="Show zero values"
            control={
              <Checkbox
                checked={showEmptyRows}
                onChange={(event) => setShowEmptyRows(event.target.checked)}
              />
            }
          />
        )}
      </div>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        rowData={showEmptyRows ? rowData : rowData.filter((row) => row.id !== 0)}
      />
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
    </>
  )
}
