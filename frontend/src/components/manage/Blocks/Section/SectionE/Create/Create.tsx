import { useCallback, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'

import useGridOptions from './schema'

export default function SectionECreate(props: any) {
  const { TableProps, errors, form, index, setActiveSection, setForm } = props
  const newNode = useRef<RowNode>()
  const grid = useRef<any>()
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
    const facilityNode = grid.current.api.getRowNode(newFacility.rowId)
    newNode.current = facilityNode
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

  const gridOptions = useGridOptions({ addFacility, errors, removeFacility })

  return (
    <>
      <Table
        {...TableProps}
        className="two-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        gridRef={grid}
        headerDepth={2}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={initialRowData}
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
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!initialRowData.length) {
            setActiveSection(index)
          }
        }}
        onRowDataUpdated={() => {
          if (newNode.current) {
            scrollToElement(
              `.ag-row[row-id=${newNode.current.data.rowId}]`,
              () => {
                grid.current.api.flashCells({
                  rowNodes: [newNode.current],
                })
              },
            )
          }
        }}
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
