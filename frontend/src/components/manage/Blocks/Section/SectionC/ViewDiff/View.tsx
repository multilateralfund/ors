import type { ITableProps } from '../../../CountryProgramme/typesCPView'
import { CPReportDiff } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import React, { useRef } from 'react'

import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import SectionC, { DeserializedDataC } from '@ors/models/SectionC'

import useGridOptions from './schema'

export type RowData = {
  count?: number
  id?: number
  rowType?: string
  tooltip?: boolean
} & DeserializedDataC

function getRowData(
  report: any,
  model: string,
): RowData[] {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []

  const data = report.section_c
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

export default function SectionCViewDiff(props: {
  TableProps: {
    context: {
      section: SectionC['data']
      variant: ReportVariant
    }
    report: CPReportDiff
    section: SectionC['data']
  } & ITableProps
  report: CPReportDiff
  showComments: boolean
  variant: ReportVariant
}) {
  const { TableProps, report, variant } = props
  const gridOptions = useGridOptions({
    model: variant.model,
  })
  const grid = useRef<any>()
  const rowData = getRowData(report, variant.model)

  return (
    <>
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
