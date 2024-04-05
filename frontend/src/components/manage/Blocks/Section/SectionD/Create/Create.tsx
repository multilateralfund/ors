import { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function SectionDCreate(props: any) {
  const { TableProps, form, setForm } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [initialRowData] = useState(form.section_d)

  return (
    <>
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
      />

      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
      </Alert>
    </>
  )
}
