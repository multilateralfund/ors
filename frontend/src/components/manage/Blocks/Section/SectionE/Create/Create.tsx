import { useCallback, useMemo, useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { isNumber } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import useStore from '@ors/store'
import { SectionE } from '@ors/types'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionDCreate(props: {
  exitFullScreen: () => void
  fullScreen: boolean
  variant: any
}) {
  const { exitFullScreen, fullScreen } = props
  const grid = useRef<any>()
  const [loading, setLoading] = useState(true)
  const rowData: SectionE = useStore(
    (state) => state.cp_report_create.section_e,
  )
  const updateRowData = useStore(
    (state) => (data: SectionE) =>
      state.cp_report_create.update?.('section_e', data),
  )

  const pinnedBottomRowData = useMemo(() => {
    return rowData.length > 0
      ? [{ facility: 'TOTAL', rowType: 'total' }, { rowType: 'control' }]
      : [{ rowType: 'control' }]
  }, [rowData])

  const addFacility = useCallback(() => {
    updateRowData([
      ...rowData,
      {
        all_uses: 0,
        destruction: 0,
        destruction_wpc: 0,
        facility: '',
        feedstock_gc: 0,
        feedstock_wpc: 0,
        generated_emissions: 0,
        remark: '',
        total: 0,
      },
    ])
  }, [rowData, updateRowData])

  const gridOptions = useGridOptions({ addFacility })

  return (
    <>
      <Table
        className={cx('two-groups mb-4', {
          'full-screen': fullScreen,
          'opacity-0': loading,
        })}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        domLayout="normal"
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        headerDepth={2}
        noRowsOverlayComponentParams={{ label: 'No data reported' }}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
        suppressCellFocus={false}
        suppressNoRowsOverlay={true}
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
          if (isNumber(event.rowIndex)) {
            const newData = [...rowData]
            newData.splice(event.rowIndex, 1, event.data)
            updateRowData(newData)
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
        2. “Total amount generated” refers to the total amount whether captured
        or not. The sum of these amounts is not to be reported under Section D.
      </Typography>
      <Typography id="footnote-3" className="italic" variant="body2">
        3. The sums of these amounts are to be reported under Section D.
      </Typography>
      <Typography id="footnote-4" className="italic" variant="body2">
        4. Amount converted to other substances in the facility. The sum of
        these amounts is not to be reported under Section D.
      </Typography>
      <Typography id="footnote-5" className="italic" variant="body2">
        5. Amount destroyed in the facility.
      </Typography>
    </>
  )
}
