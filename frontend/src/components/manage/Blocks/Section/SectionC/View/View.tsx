import type { TableProps } from '@ors/components/manage/Blocks/CountryProgramme/CPView'
import { CPReport } from '@ors/types/api_country-programme_records'
import { ReportVariant } from '@ors/types/variants'

import { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { each, includes, union } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import SectionC from '@ors/models/SectionC'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(report: any, model: string) {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []
  each(report.section_c, (item) => {
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

export default function SectionCView(props: {
  TableProps: TableProps & {
    context: {
      section: SectionC['data']
      variant: ReportVariant
    }
    report: CPReport
    section: SectionC['data']
  }
  report: CPReport
  variant: ReportVariant
}) {
  const { TableProps, report, variant } = props
  const gridOptions = useGridOptions({
    model: variant.model,
  })
  const grid = useRef<any>()
  const [rowData] = useState(() => getRowData(report, variant.model))

  return (
    <>
      <Alert
        className="mb-4"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnotes />
      </Alert>
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
