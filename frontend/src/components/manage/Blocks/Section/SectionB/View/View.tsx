import type { TableProps } from '../../../CountryProgramme/CPView'
import { CPReport } from '@ors/types/api_country-programme_records'
import { EmptyReportType } from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import { useMemo, useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getVariant } from '@ors/slices/createCPReportsSlice'

import TableDataSelector, {
  useTableDataSelector,
} from '../../SectionA/TableDataSelector'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'
function getGroupName(substance: any) {
  if (substance.blend_id) {
    return 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group || 'Other'
}

function getRowData(report: CPReport) {
  const variant = getVariant(report)
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
      group.startsWith('Blends')
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

export default function SectionBView(props: {
  TableProps: TableProps
  emptyForm: EmptyReportType
  report: CPReport
  variant: ReportVariant
}) {
  const { TableProps, emptyForm, report, variant } = props
  const { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_b || [],
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
        return {}
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
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={4}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
    </>
  )
}
