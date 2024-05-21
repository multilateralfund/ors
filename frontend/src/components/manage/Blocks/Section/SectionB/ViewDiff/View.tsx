import { CPReportDiff } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import React, { useRef, useState } from 'react'

import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import { DeserializedDataB } from '@ors/models/SectionB'

import useGridOptions from './schema'

function getGroupName(substance: any, model: string) {
  if (substance.blend_id) {
    return includes(['IV', 'V'], model)
      ? 'Blends'
      : 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group || 'Other'
}

export type RowData = {
  count?: number
  display_name?: string
  group?: string
  id?: number
  row_id: string
  rowType: string
  tooltip?: boolean
} & DeserializedDataB

function getRowData(
  reportDiff: CPReportDiff,
  variant: ReportVariant,
): RowData[] {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []

  const data = reportDiff.section_b

  each(data, (item) => {
    const group = getGroupName(item, variant.model)
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
      group.startsWith('Annex F') && includes(variant?.model, 'IV')
        ? [
            {
              display_name: 'Controlled substances',
              group,
              row_id: 'group-controlled_substances',
              rowType: 'group',
            },
          ]
        : [],
      dataByGroup[group],
      group.startsWith('Blends') && !includes(['V'], variant?.model)
        ? [
            {
              display_name: 'Other',
              group,
              row_id: 'other-new_substance',
              rowType: 'control',
            },
          ]
        : [],
      [{ display_name: 'Sub-total', group, rowType: 'subtotal' }],
    )
  })
  return rowData
}

function getPinnedRowData(rowData: any) {
  return rowData.length > 0
    ? [{ display_name: 'TOTAL', rowType: 'total', tooltip: true }]
    : []
}

export default function SectionBViewDiff(props: any) {
  const { TableProps, emptyForm, report, variant } = props
  const { gridOptionsAll } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_b || [],
    })
  const grid = useRef<any>()
  const rowData = getRowData(report, variant)
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptionsAll.columnDefs}
        defaultColDef={gridOptionsAll.defaultColDef}
        gridRef={grid}
        headerDepth={4}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
