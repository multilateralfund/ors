import { useCallback, useMemo, useRef, useState } from 'react'

import { Typography } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { findIndex } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'

import useGridOptions from './schema'

export default function SectionECreate(props: any) {
  const { TableProps, form, index, setActiveSection, setForm } = props
  const newNode = useRef<RowNode>()
  const grid = useRef<any>()
  const newFacilityIndex = useRef(form.section_e.length + 1)
  const [initialRowData] = useState(form.section_e)

  const pinnedBottomRowData = useMemo(() => {
    return form.section_e.length > 0
      ? [{ facility: 'TOTAL', rowType: 'total' }, { rowType: 'control' }]
      : [{ rowType: 'control' }]
  }, [form.section_e])

  const addFacility = useCallback(() => {
    const id = newFacilityIndex.current
    const newFacility = {
      all_uses: 0,
      destruction: 0,
      destruction_wpc: 0,
      facility: '',
      feedstock_gc: 0,
      feedstock_wpc: 0,
      generated_emissions: 0,
      remarks: '',
      row_id: `facility_${id}`,
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
    const facilityNode = grid.current.api.getRowNode(newFacility.row_id)
    newNode.current = facilityNode
    newFacilityIndex.current = newFacilityIndex.current + 1
  }, [setForm])

  const removeFacility = useCallback(
    (props: any) => {
      const removedFacility = props.data
      const newData = [...form.section_e]
      const index = findIndex(
        form.section_e,
        (facility: any) => facility.row_id == removedFacility.row_id,
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
      <Table
        {...TableProps}
        className="two-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={2}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.section_e]
          const index = findIndex(
            newData,
            (row: any) => row.row_id == event.data.row_id,
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
              `.ag-row[row-id=${newNode.current.data.row_id}]`,
              () => {
                grid.current.api.flashCells({
                  rowNodes: [newNode.current],
                })
                newNode.current = undefined
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
