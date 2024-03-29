import { CPReport } from '@ors/types/api_country-programme_records'

import { useMemo, useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { each, includes, union } from 'lodash'

import components from '@ors/config/Table/components'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { DeserializedDataA } from '@ors/models/SectionA'

import TableDataSelector, { useTableDataSelector } from '../TableDataSelector'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export type RowData = DeserializedDataA & {
  count?: number
  display_name?: string
  field?: string
  group?: string
  row_id: string
  rowType: string
  tooltip?: boolean
}

function getRowData(report: CPReport): RowData[] {
  let rowData: RowData[] = []
  const dataByGroup: Record<string, any[]> = {}
  const groups: Array<string> = []
  each(report.section_a, (item) => {
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
      group === 'Annex C, Group I'
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

export default function SectionAView(props: any) {
  const { TableProps, emptyForm, report, variant } = props
  const { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_a || [],
    })
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report))
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))
  const { setValue: setTableDataValue, value: tableDataValue } =
    useTableDataSelector(
      includes(['IV', 'V'], variant.model) ? 'sector' : 'all',
    )

  const gridOptions = useMemo(() => {
    switch (tableDataValue) {
      case 'all':
        return gridOptionsAll
      case 'sector':
        return gridOptionsBySector
      case 'trade':
        return gridOptionsBySubstanceTrade
      default:
        return { columnDefs: [], defaultColDef: [] }
    }
  }, [
    gridOptionsAll,
    gridOptionsBySector,
    gridOptionsBySubstanceTrade,
    tableDataValue,
  ])

  return (
    <>
      {includes(['IV', 'V'], variant.model) && (
        <TableDataSelector
          className="py-4"
          changeHandler={(_, value) => setTableDataValue(value)}
          value={tableDataValue}
        />
      )}
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        components={components}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={3}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
    </>
  )
}
