import type { SectionARowData } from '../types'
import { CPReport } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import { useMemo, useState } from 'react'

import { Alert, Checkbox, FormControlLabel } from '@mui/material'
import cx from 'classnames'
import { each, includes, union } from 'lodash'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import TableDataSelector, { useTableDataSelector } from '../TableDataSelector'
import { SectionAViewProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(
  report: CPReport,
  showOnlyReported: boolean,
  model: ReportVariant['model'],
): SectionARowData[] {
  let rowData: SectionARowData[] = []
  const dataByGroup: Record<string, any[]> = {}
  const groups: string[] = []

  let data = report.section_a
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
      [{ display_name: group, group, row_id: group, rowType: 'group' }],
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
      [
        {
          display_name: 'Sub-total',
          group,
          row_id: `subtotal_${group}`,
          rowType: 'subtotal',
        },
      ],
    )
  })
  return rowData
}

function getPinnedRowData(rowData: SectionARowData[]): SectionARowData[] {
  return rowData.length > 0
    ? [
        {
          display_name: 'TOTAL',
          row_id: 'bottom_total',
          rowType: 'total',
          tooltip: true,
        },
      ]
    : []
}

export default function SectionAView(props: SectionAViewProps) {
  const { Comments, TableProps, emptyForm, report, showComments, variant } =
    props
  const { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_a || [],
    })
  const [showOnlyReported, setShowOnlyReported] = useState(false)
  const { setValue: setTableDataValue, value: tableDataValue } =
    useTableDataSelector()

  const rowData = getRowData(report, showOnlyReported, variant.model)
  const [pinnedBottomRowData] = useState(() => getPinnedRowData(rowData))

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
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnotes />
      </Alert>
      <div
        className={cx('flex', {
          'justify-between': includes(['IV', 'V'], variant.model),
          'justify-end': !includes(['IV', 'V'], variant.model),
        })}
      >
        {includes(['IV', 'V'], variant.model) && (
          <TableDataSelector
            changeHandler={(_, value) => setTableDataValue(value)}
            value={tableDataValue}
          />
        )}
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
        rowData={[...rowData, ...pinnedBottomRowData]}
      />
      {showComments && <Comments section="section_a" viewOnly={false} />}
    </>
  )
}
