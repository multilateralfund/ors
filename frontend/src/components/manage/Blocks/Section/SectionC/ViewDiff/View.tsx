import React, { useRef } from 'react'

import { Alert, Typography } from '@mui/material'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import { DeserializedDataC } from '@ors/models/SectionC'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export type RowData = {
  count?: number
  id?: number
  rowType?: string
  tooltip?: boolean
} & DeserializedDataC

function getRowData(report: any, model: string): RowData[] {
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

export default function SectionCViewDiff(props: any) {
  const { TableProps, report, reportDiff, variant } = props
  const gridOptions = useGridOptions({
    model: variant.model,
  })
  const grid = useRef<any>()
  const rowData = getRowData(reportDiff, variant.model)

  const isLatestVersion = !report.data?.final_version_id
  const version = report.data?.version

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
