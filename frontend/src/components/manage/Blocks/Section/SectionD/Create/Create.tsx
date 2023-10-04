import { useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import useStore from '@ors/store'
import { SectionD } from '@ors/types'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionDCreate(props: {
  exitFullScreen: () => void
  fullScreen: boolean
  variant: any
}) {
  const { exitFullScreen, fullScreen } = props
  const grid = useRef<any>()
  const gridOptions = useGridOptions()
  const [loading, setLoading] = useState(true)
  const rowData: SectionD = useStore(
    (state) => state.cp_report_create.section_d,
  )
  const updateRowData = useStore(
    (state) => (data: SectionD) =>
      state.cp_report_create.update?.('section_d', data),
  )

  return (
    <>
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
        rowData={rowData}
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
        onCellValueChanged={(event) => {
          const newData = [...rowData]
          const index = findIndex(rowData, (row) => row.id == event.data.id)
          newData.splice(index, 1, event.data)
          updateRowData(newData)
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
