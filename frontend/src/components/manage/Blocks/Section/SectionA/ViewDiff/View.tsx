import { CPReportDiff } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import { useRef } from 'react'

import { Alert, Typography } from '@mui/material'
import { each, includes, union } from 'lodash'

import components from '@ors/config/Table/components'

import SimpleTable from '@ors/components/manage/Form/SimpleTable'
import Table from '@ors/components/manage/Form/Table'
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

export default function SectionAViewDiff(props: any) {
  const { TableProps, emptyForm, report, reportDiff, variant } = props
  const { gridOptionsAll } = useGridOptions({
    model: variant.model,
    usages: emptyForm.usage_columns?.section_a || [],
  })
  const grid = useRef<any>()

  const rowData = getRowData(reportDiff, false, variant.model)

  const isLatestVersion = !report.data?.final_version_id
  const version = report.data?.version

  const tableProps = {
    ...TableProps,
    context: {
      ...TableProps.context,
      is_diff: true,
    },
  }

  return (
    <>
      {version && (
        <Alert
          className="bg-mlfs-bannerColor"
          icon={<IoInformationCircleOutline size={24} />}
          severity="info"
        >
          <Typography className="transition-all">
            The table below presents the data from
            <span className="font-semibold"> version {version} </span>
            {isLatestVersion && '(latest)'} on the upper rows and from
            <span className="font-semibold"> version {version - 1} </span>
            {isLatestVersion && '(previous)'} on the bottom rows.
          </Typography>
        </Alert>
      )}
      <SimpleTable
        {...TableProps}
        columnDefs={gridOptionsAll.columnDefs}
        defaultColDef={gridOptionsAll.defaultColDef}
        rowData={rowData}
      />
      <Table
        {...tableProps}
        columnDefs={gridOptionsAll.columnDefs}
        components={components}
        defaultColDef={gridOptionsAll.defaultColDef}
        gridRef={grid}
        headerDepth={3}
        // pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
      />
    </>
  )
}
