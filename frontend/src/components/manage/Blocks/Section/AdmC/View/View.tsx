import { CPReport } from '@ors/types/api_country-programme_records'
import { AdmRow, EmptyFormType } from '@ors/types/api_empty-form'

import { useMemo, useRef } from 'react'

import { groupBy } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import { ITableProps } from '../../../CountryProgramme/typesCPView'
import { AdmCRow } from '../types'
import useGridOptions from './schema'

function getRowData(report: CPReport, rows: AdmRow[]) {
  const dataByRowId = groupBy(report.adm_c, 'row_id')
  const result: AdmCRow[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const r: AdmCRow = {
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
    }
    switch (row.type) {
      case 'title':
        r.row_id = `group_title_${row.index ?? row.id}`
        r.rowType = 'group'
        break
      case 'subtitle':
        r.row_id = `group_subtitle_${row.index ?? row.id}`
        r.rowType = 'hashed'
        break
      case 'question':
        r.row_id = `group_question_${row.index ?? row.id}`
        break
      default:
        r.row_id = `unknown_${row.id}`
    }
    result.push(r)
  }
  return result
}

interface AdmCProps {
  TableProps: ITableProps
  emptyForm: EmptyFormType
  report: CPReport
}

export default function AdmC(props: AdmCProps) {
  const { TableProps, emptyForm, report } = props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  const grid = useRef<any>()
  const gridOptions = useGridOptions({
    adm_columns: columns,
  })
  const rowData = useMemo(() => getRowData(report, rows), [report, rows])

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        rowData={rowData}
      />
    </>
  )
}
