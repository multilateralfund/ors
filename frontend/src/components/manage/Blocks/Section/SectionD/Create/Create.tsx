import { useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionDCreate(props: any) {
  const { exitFullScreen, form, fullScreen, setForm } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [loading, setLoading] = useState(true)
  const [initialRowData] = useState(form.section_d)

  return (
    <>
      <Typography className="mb-4" component="h2" variant="h6">
        SECTION D. ANNEX F, GROUP II - DATA ON HFC-23 GENERATION (METRIC TONNES)
      </Typography>
      <Table
        className={cx('mb-4', {
          'full-screen': fullScreen,
          'opacity-0': loading,
        })}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        domLayout="normal"
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        noRowsOverlayComponentParams={{ label: 'No data reported' }}
        rowData={initialRowData}
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        HeaderComponent={
          fullScreen
            ? () => {
                return (
                  <IconButton
                    className="exit-fullscreen p-2 text-primary"
                    aria-label="exit fullscreen"
                    onClick={exitFullScreen}
                  >
                    <IoClose size={32} />
                  </IconButton>
                )
              }
            : () => null
        }
        getRowId={(props) => {
          return props.data.rowId
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.section_c]
          const index = findIndex(
            newData,
            (row: any) => row.rowId == event.data.rowId,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, section_c: newData })
          }
        }}
        onFirstDataRendered={() => setLoading(false)}
        withFluidEmptyColumn
        withSeparators
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
