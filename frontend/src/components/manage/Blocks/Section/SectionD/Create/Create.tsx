import { useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

export default function SectionDCreate(props: any) {
  const { TableProps, form, index, setActiveSection, setForm } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [initialRowData] = useState(form.section_d)

  return (
    <>
      <Table
        {...TableProps}
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
        domLayout="normal"
        gridRef={grid}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.section_d]
          const index = findIndex(
            newData,
            (row: any) => row.rowId == event.data.rowId,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, section_d: newData })
          }
        }}
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!initialRowData.length) {
            setActiveSection(index)
          }
        }}
      />
      <Typography id="footnote-1" className="italic" variant="body2">
        1. Edit by pressing double left-click or ENTER on a field.
      </Typography>
      <Typography id="footnote-2" className="italic" variant="body2">
        2. HFC-23 generation that is captured, whether for destruction,
        feedstock or any other use, shall be reported in this form
      </Typography>
      <Typography id="footnote-3" className="italic" variant="body2">
        3. Amounts of HFC-23 captured for destruction or feedstock use will not
        be counted as production as per Article 1 of the Montreal Protocol.
      </Typography>
    </>
  )
}
