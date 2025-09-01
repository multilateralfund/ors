import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Alert } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { findIndex, last } from 'lodash'

import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import Footnote from '@ors/components/ui/Footnote/Footnote'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'

import { SectionECreateProps } from '../types'
import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function SectionECreate(props: SectionECreateProps) {
  const { TableProps, form, setForm } = props
  const newNode = useRef<RowNode>()
  const grid = useRef<any>()
  const newFacilityIndex = useRef(last<any>(form.section_e)?.id + 1 || 1)
  const [initialRowData] = useState(form.section_e)

  const pinnedBottomRowData = useMemo(() => {
    return form.section_e.length > 0
      ? [
          {
            facility: 'TOTAL',
            row_id: 'bottom_total',
            rowType: 'total',
            tooltip: true,
          },
          { rowType: 'control' },
        ]
      : [{ row_id: 'add_facility', rowType: 'control' }]
  }, [form.section_e])

  const addFacility = useCallback(() => {
    const id = newFacilityIndex.current
    const newFacility = {
      id,
      all_uses: 0,
      stored_at_start_of_year: 0,
      destruction: 0,
      destruction_wpc: 0,
      facility: '',
      feedstock_gc: 0,
      feedstock_wpc: 0,
      generated_emissions: 0,
      stored_at_end_of_year: 0,
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
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnote id="" index="">
          Facility name must be provided if data in Section D is provided
        </Footnote>
        <Footnotes />
      </Alert>
      <Table
        {...TableProps}
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
        onRowDataUpdated={() => {
          if (newNode.current) {
            scrollToElement({
              callback: () => {
                grid.current.api.flashCells({
                  rowNodes: [newNode.current],
                })
                newNode.current = undefined
              },
              selectors: `.ag-row[row-id=${newNode.current.data.row_id}]`,
            })
          }
        }}
      />
    </>
  )
}
