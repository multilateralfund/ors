import { useRef, useState } from 'react'

import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

function getGroupName(substance: any) {
  if (substance.blend_id) {
    return 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group || 'Other'
}

function getRowData(report: any) {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []
  each(report.section_b, (item) => {
    const group = getGroupName(item)
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

export default function SectionBView(props: any) {
  const { TableProps, emptyForm, report, variant } = props
  const gridOptions = useGridOptions({
    model: variant.model,
    usages: emptyForm.usage_columns?.section_b || [],
  })
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report))
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={4}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
