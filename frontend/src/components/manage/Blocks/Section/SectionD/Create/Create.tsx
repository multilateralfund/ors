import { useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { AgGridReact } from 'ag-grid-react'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import Footnote from '@ors/components/ui/Footnote/Footnote'

import { SectionDCreateProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function SectionDCreate(props: SectionDCreateProps) {
  const { TableProps, form, setForm } = props
  const grid = useRef<AgGridReact>()
  const gridOptions = useGridOptions()
  const [initialRowData] = useState(form.section_d)

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnote id="" index="">
          Data in Section D should be provided (if applicable) even if breakdown
          in Section E by enterprises are not reported as reporting under
          Section E is voluntary for the shaded column
        </Footnote>
        <Footnotes />
      </Alert>
      <Table
        {...TableProps}
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
    </>
  )
}
