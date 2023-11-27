import { useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { findIndex, groupBy, map } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

export default function AdmBCreate(props: any) {
  const { TableProps, emptyForm, form, index, setActiveSection, setForm } =
    props
  const { columns = [], rows = [] } = emptyForm.adm_c || {}
  // const newNode = useRef<RowNode>()
  const grid = useRef<any>()
  // const newFacilityIndex = useRef(form.section_e.length + 1)
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
  })

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={2}
        // pinnedBottomRowData={pinnedBottomRowData}
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
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!initialRowData.length) {
            setActiveSection(index)
          }
        }}
        onRowDataUpdated={() => {
          // if (newNode.current) {
          //   scrollToElement(
          //     `.ag-row[row-id=${newNode.current.data.row_id}]`,
          //     () => {
          //       grid.current.api.flashCells({
          //         rowNodes: [newNode.current],
          //       })
          //       newNode.current = undefined
          //     },
          //   )
          // }
        }}
      />
      <Typography id="footnote-1" className="italic" variant="body2">
        1. If Yes, since when (Date) / If No, planned date.
      </Typography>
    </>
  )
}
