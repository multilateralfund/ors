import { useRef, useState } from 'react'

import { Alert, Typography } from '@mui/material'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnote from '@ors/components/ui/Footnote/Footnote'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function SectionDCreate(props: any) {
  const { TableProps, form, index, setActiveSection, setForm } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [initialRowData] = useState(form.section_d)

  return (
    <>
      <Alert className="mb-4" icon={false} severity="info">
        <Typography>
          Edit by pressing double left-click or ENTER on a field.
        </Typography>
      </Alert>
      <Table
        {...TableProps}
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
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
            (row: any) => row.row_id == event.data.row_id,
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

      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnote id="1">
          HFC-23 generation that is captured, whether for destruction, feedstock
          or any other use, shall be reported in this form
        </Footnote>
        <Footnote id="2">
          Amounts of HFC-23 captured for destruction or feedstock use will not
          be counted as production as per Article 1 of the Montreal Protocol.
        </Footnote>
      </Alert>
    </>
  )
}
