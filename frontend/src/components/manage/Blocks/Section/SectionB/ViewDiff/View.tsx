import type { ITableProps } from '../../../CountryProgramme/typesCPView'
import { CPReportDiff } from '@ors/types/api_country-programme_records'
import { EmptyFormType } from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import React, { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import cx from 'classnames'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { DeserializedDataB } from '@ors/models/SectionB'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

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
  showOnlyReported: boolean,
): RowData[] {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []

  let data = reportDiff.section_b
  if (showOnlyReported) {
    data = data.filter((item) => item.id !== 0)
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

export default function SectionBView(props: {
  Comments: React.FC<{ section: string, viewOnly: boolean }>
  TableProps: ITableProps
  emptyForm: EmptyFormType
  reportDiff: CPReportDiff
  showComments: boolean
  variant: ReportVariant
}) {
  const { TableProps, emptyForm, reportDiff, variant } =
    props
  const { gridOptionsAll } =
    useGridOptions({
      model: variant.model,
      usages: emptyForm.usage_columns?.section_b || [],
    })
  const grid = useRef<any>()
  const rowData = getRowData(reportDiff, variant, false)
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
        defaultColDef={gridOptionsAll.defaultColDef}
        gridRef={grid}
        headerDepth={4}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
