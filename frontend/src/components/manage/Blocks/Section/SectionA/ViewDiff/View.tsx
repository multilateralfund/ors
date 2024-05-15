import { CPReportDiff } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import cx from 'classnames'
import { each, includes, union } from 'lodash'

import components from '@ors/config/Table/components'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { DeserializedDataA } from '@ors/models/SectionA'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export type RowData = {
  count?: number
  display_name?: string
  field?: string
  group?: string
  id?: number
  row_id: string
  rowType: string
  tooltip?: boolean
} & DeserializedDataA

function getRowData(
  reportDiff: CPReportDiff,
  showOnlyReported: boolean,
  model: ReportVariant['model'],
): RowData[] {
  let rowData: RowData[] = []
  const dataByGroup: Record<string, any[]> = {}
  const groups: Array<string> = []

  let data = reportDiff.section_a
  if (showOnlyReported) {
    data = data.filter((item) => item.id !== 0)
  }

  each(data, (item) => {
    const group = item.group || 'Other'
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
      group === 'Annex C, Group I' && !includes(['V'], model)
        ? [
            {
              display_name: 'Other',
              group,
              row_id: 'other-new_substance',
              rowType: 'control',
            },
          ]
        : [],
    )
  })
  return rowData
}

function getPinnedRowData(rowData: any) {
  return rowData.length > 0
    ? [{ display_name: 'TOTAL', rowType: 'total', tooltip: true }]
    : []
}

export default function SectionAViewDiff(props: any) {
  const { TableProps, emptyForm, report, variant } =
    props
  const { gridOptionsAll } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_a || [],
    })
  const grid = useRef<any>()

  const rowData = getRowData(report, false, variant.model)
  /* TODO: should probably remove bottom row */
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

  return (
    <>
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
      <div
        className={cx('flex', {
          'justify-between': includes(['IV', 'V'], variant.model),
          'justify-end': !includes(['IV', 'V'], variant.model),
        })}
      >
      </div>
      <Table
        {...TableProps}
        columnDefs={gridOptionsAll.columnDefs}
        components={components}
        defaultColDef={gridOptionsAll.defaultColDef}
        gridRef={grid}
        headerDepth={3}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
