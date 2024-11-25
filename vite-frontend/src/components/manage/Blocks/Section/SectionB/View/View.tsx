import type { ITableProps } from '../../../CountryProgramme/typesCPView'
import type { SectionBRowData } from '../types'
import { CPReport } from '@ors/types/api_country-programme_records'
import { EmptyFormType } from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import React, { useMemo, useRef, useState } from 'react'

import { Alert, Checkbox, FormControlLabel } from '@mui/material'
import cx from 'classnames'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import TableDataSelector, {
  useTableDataSelector,
} from '../../SectionA/TableDataSelector'
import { SectionBViewProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getGroupName(substance: CPReport['section_b'][0], model: string) {
  if (substance.blend_id && substance.group.startsWith('Blends')) {
    return includes(['IV', 'V'], model)
      ? 'Blends'
      : 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group || 'Other'
}

function getRowData(
  report: CPReport,
  variant: ReportVariant,
  showOnlyReported: boolean,
): SectionBRowData[] {
  let rowData: SectionBRowData[] = []
  const dataByGroup: Record<string, any> = {}
  const groups: string[] = []

  let data = report.section_b
  if (showOnlyReported) {
    data = data.filter((item: any) => item.id !== 0)
  }

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
      [{ display_name: group, group, row_id: group, rowType: 'group' }],
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

function getPinnedRowData(rowData: SectionBRowData[]): SectionBRowData[] {
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

export default function SectionBView(props: SectionBViewProps) {
  const { Comments, TableProps, emptyForm, report, showComments, variant } =
    props
  const { gridOptionsAll, gridOptionsBySector, gridOptionsBySubstanceTrade } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_b || [],
    })
  const grid = useRef<any>()
  const [showOnlyReported, setShowOnlyReported] = useState(false)
  const { setValue: setTableDataValue, value: tableDataValue } =
    useTableDataSelector()
  const rowData = getRowData(report, variant, showOnlyReported)
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
      <Table
        key={tableDataValue}
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={4}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
      {showComments && <Comments section="section_b" viewOnly={false} />}
    </>
  )
}
