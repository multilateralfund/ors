import React, { useRef, useState } from 'react'

import { findIndex, groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

export default function AdmBCreate(props: any) {
  const { TableProps, emptyForm, form, setForm, variant } = props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  const grid = useRef<any>()
  const [initialRowData] = useState(() => {
    const dataByRowId = groupBy(form.adm_c, 'row_id')

    return map(rows, (row) => ({
      row_id: row.id,
      values: dataByRowId[row.id]?.[0]?.values || [],
      ...row,
      ...(row.type === 'title' ? { rowType: 'group' } : {}),
      ...(row.type === 'subtitle' ? { rowType: 'hashed' } : {}),
    }))
  })

  const gridOptions = useGridOptions({
    adm_columns: columns,
    model: variant.model,
  })

  return (
    <>
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={2}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.adm_c]
          const index = findIndex(
            newData,
            (row: any) => row.row_id === event.data.row_id,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, adm_c: newData })
          }
        }}
        onRowDataUpdated={() => {}}
      />
    </>
  )
}
