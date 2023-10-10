import { useCallback, useMemo, useRef, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import { applyTransaction, isInViewport } from '@ors/helpers/Utils/Utils'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

export default function SectionECreate(props: any) {
  const { exitFullScreen, form, fullScreen, setForm } = props
  const grid = useRef<any>()
  const [loading, setLoading] = useState(true)
  const [initialRowData] = useState(form.section_e)

  const pinnedBottomRowData = useMemo(() => {
    return form.section_e.length > 0
      ? [{ facility: 'TOTAL', rowType: 'total' }, { rowType: 'control' }]
      : [{ rowType: 'control' }]
  }, [form.section_e])

  const addFacility = useCallback(() => {
    const id = form.section_e.length + 1
    const newFacility = {
      all_uses: 0,
      destruction: 0,
      destruction_wpc: 0,
      facility: '',
      feedstock_gc: 0,
      feedstock_wpc: 0,
      generated_emissions: 0,
      remark: '',
      rowId: `facility_${id}`,
      total: 0,
    }
    const prevNode =
      id > 1 ? grid.current.api.getRowNode(`facility_${id - 1}`) : null
    setForm((form: any) => ({
      ...form,
      section_e: [...form.section_e, newFacility],
    }))
    applyTransaction(grid.current.api, {
      add: [newFacility],
      addIndex: prevNode ? prevNode.rowIndex + 1 : 0,
    })
    setTimeout(() => {
      const rowEl = document.querySelector(
        `.ag-row[row-id=${newFacility.rowId}]`,
      )
      if (rowEl && !isInViewport(rowEl)) {
        const top = rowEl.getBoundingClientRect().top + window.scrollY
        window.scroll({
          behavior: 'smooth',
          top,
        })
      }
    }, 300)
  }, [form.section_e, setForm])

  const removeFacility = useCallback(
    (props: any) => {
      const removedFacility = props.data
      const newData = [...form.section_e]
      const index = findIndex(
        form.section_e,
        (facility: any) => facility.rowId == removedFacility.rowId,
      )
      if (index > -1) {
        newData.splice(index, 1)
        setForm((form: any) => ({ ...form, section_e: newData }))
        applyTransaction(grid.current.api, {
          remove: [removedFacility],
        })
      }
    },
    [form.section_e, setForm],
  )

  const gridOptions = useGridOptions({ addFacility, removeFacility })

  return (
    <>
      <Typography className="mb-4" component="h2" variant="h6">
        SECTION E. ANNEX F, GROUP II - DATA ON HFC-23 EMISSIONS (METRIC TONNES)
      </Typography>
      <Table
        className={cx('two-groups mb-4', {
          'full-screen': fullScreen,
          'opacity-0': loading,
        })}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        domLayout={fullScreen ? 'normal' : 'autoHeight'}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        headerDepth={2}
        noRowsOverlayComponentParams={{ label: 'No data reported' }}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={initialRowData}
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
        getRowId={(props) => {
          return props.data.rowId
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.section_e]
          const index = findIndex(
            newData,
            (row: any) => row.rowId == event.data.rowId,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, section_e: newData })
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
