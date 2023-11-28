import { useCallback, useMemo, useRef, useState } from 'react'

import { Alert, Typography } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { findIndex, last } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnote from '@ors/components/ui/Footnote/Footnote'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function SectionECreate(props: any) {
  const { TableProps, form, index, setActiveSection, setForm } = props
  const newNode = useRef<RowNode>()
  const grid = useRef<any>()
  const newFacilityIndex = useRef(last<any>(form.section_e)?.id + 1 || 1)
  const [initialRowData] = useState(form.section_e)

  const pinnedBottomRowData = useMemo(() => {
    return form.section_e.length > 0
      ? [
          { facility: 'TOTAL', rowType: 'total', tooltip: true },
          { rowType: 'control' },
        ]
      : [{ rowType: 'control' }]
  }, [form.section_e])

  console.log('HERE', initialRowData)

  const addFacility = useCallback(() => {
    const id = newFacilityIndex.current
    const newFacility = {
      id,
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
      <Alert className="mb-4" icon={false} severity="info">
        <Typography>
          Edit by pressing double left-click or ENTER on a field.
        </Typography>
      </Alert>
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
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnote id="1">
          “Total amount generated” refers to the total amount whether captured
          or not. The sum of these amounts is not to be reported under Section
          D.
        </Footnote>
        <Footnote id="2">
          The sums of these amounts are to be reported under Section D.
        </Footnote>
        <Footnote id="3">
          Amount converted to other substances in the facility. The sum of these
          amounts is not to be reported under Section D.
        </Footnote>
        <Footnote id="4">Amount destroyed in the facility.</Footnote>
      </Alert>
    </>
  )
}
