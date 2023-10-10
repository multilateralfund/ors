import { useMemo, useRef, useState } from 'react'

import { Box, Button, IconButton, Modal, Typography } from '@mui/material'
import { CellValueChangedEvent } from 'ag-grid-community'
import cx from 'classnames'
import { each, find, findIndex, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api'
import { applyTransaction, isInViewport } from '@ors/helpers/Utils/Utils'
import useStore from '@ors/store'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

function getRowData(data: any) {
  let rowData: Array<any> = []
  const dataByGroup: Record<string, any> = {}
  const groups: Array<string> = []
  each(data, (item) => {
    const group = item.group || 'Other'
    if (!dataByGroup[group]) {
      dataByGroup[group] = []
    }
    if (!includes(groups, group)) {
      groups.push(group)
    }
    dataByGroup[group].push({ ...item, group })
  })
  each(groups, (group: string) => {
    rowData = union(
      rowData,
      [
        {
          count: dataByGroup[group].length,
          display_name: group,
          group,
          rowId: group,
          rowType: 'group',
        },
      ],
      dataByGroup[group],
      [
        {
          display_name: 'Sub-total',
          group,
          rowId: `subtotal[${group}]`,
          rowType: 'subtotal',
        },
      ],
    )
  })
  return rowData
}

export default function SectionACreate(props: any) {
  const { emptyForm, exitFullScreen, form, fullScreen, mapSubstance, setForm } =
    props
  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )
  const grid = useRef<any>()
  const [initialRowData] = useState(getRowData(form.section_a))

  const [addSubstanceModal, setAddSubstanceModal] = useState(false)

  const substancesOptions = useMemo(() => {
    const data: Array<any> = []
    const substancesInForm = form.section_a.map(
      (substance: any) => substance.rowId,
    )
    each(substances, (substance) => {
      if (
        includes(['Annex C, Group I'], substance.group) &&
        includes(substance.sections, 'A') &&
        !includes(substancesInForm, `substance_${substance.id}`)
      ) {
        data.push(mapSubstance(substance))
      }
    })
    return data
  }, [substances, form.section_a, mapSubstance])

  const gridOptions = useGridOptions({
    onRemoveSubstance: (props: any) => {
      const removedSubstance = props.data
      const newData = [...form.section_a]
      const index = findIndex(
        form.section_a,
        (substance: any) => substance.rowId == removedSubstance.rowId,
      )
      if (index > -1) {
        const groupNode = grid.current.api.getRowNode(removedSubstance.group)
        newData.splice(index, 1)
        setForm((form: any) => ({ ...form, section_a: newData }))
        applyTransaction(grid.current.api, {
          remove: [props.data],
          update: [{ ...groupNode.data, count: groupNode.data.count - 1 }],
        })
      }
    },
    openAddSubstanceModal: () => setAddSubstanceModal(true),
    usages: emptyForm.usage_columns || [],
  })

  function getUsagesOnCellValueChange(event: CellValueChangedEvent<any>) {
    const usages = event.data.record_usages
    if (event.source === 'cellClear' && event.colDef.category === 'usage') {
      const usageIndex = findIndex(
        usages,
        (item: any) => item.usage_id === event.colDef.id,
      )
      if (usageIndex > -1) {
        usages[usageIndex].quantity = null
        applyTransaction(grid.current.api, {
          update: [{ ...event.data, record_usages: usages }],
        })
      }
    }
    return usages
  }

  return (
    <>
      <Typography className="mb-4" component="h2" variant="h6">
        SECTION A. ANNEX A, ANNEX B, ANNEX C - GROUP I AND ANNEX E - DATA ON
        CONTROLLED SUBSTANCES (METRIC TONNES)
      </Typography>
      <Table
        className={cx('three-groups mb-4', {
          'full-screen': fullScreen,
        })}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        domLayout={fullScreen ? 'normal' : 'autoHeight'}
        enableCellChangeFlash={false}
        enablePagination={false}
        gridRef={grid}
        headerDepth={3}
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
        pinnedBottomRowData={[
          { display_name: 'TOTAL', rowType: 'total' },
          { rowType: 'control' },
        ]}
        onCellValueChanged={(event) => {
          const usages = getUsagesOnCellValueChange(event)
          const newData = [...form.section_a]
          const index = findIndex(
            newData,
            (row: any) => row.rowId == event.data.rowId,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
              record_usages: usages,
            })
            setForm({ ...form, section_a: newData })
          }
        }}
        withFluidEmptyColumn
        withSeparators
      />
      <Typography className="italic" variant="body2">
        1. Edit by pressing double left-click or ENTER on a field.
      </Typography>
      <Typography className="italic" variant="body2">
        2. Where the data involves a blend of two or more substances, the
        quantities of individual components of controlled substances must be
        indicated separately.
      </Typography>
      <Typography className="italic" variant="body2">
        3. Indicate relevant controlled substances.
      </Typography>
      <Typography className="italic" variant="body2">
        4. Provide explanation if total sector use and consumption
        (import-export+production) is different (e.g, stockpiling).
      </Typography>
      {addSubstanceModal && (
        <Modal
          aria-labelledby="add-substance-modal-title"
          open={addSubstanceModal}
          onClose={() => setAddSubstanceModal(false)}
          keepMounted
        >
          <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
            <Typography
              id="add-substance-modal-title"
              className="mb-4 text-typography-secondary"
              component="h2"
              variant="h6"
            >
              Select substance
            </Typography>
            <Field
              Input={{ autoComplete: 'off' }}
              getOptionLabel={(option: any) => option.display_name}
              groupBy={(option: any) => option.group}
              options={substancesOptions}
              value={null}
              widget="autocomplete"
              onChange={(event: any, newSubstance: any) => {
                if (document.activeElement) {
                  // @ts-ignore
                  document.activeElement.blur()
                }
                const added = find(
                  form.section_a,
                  (substance) => substance.rowId === newSubstance.rowId,
                )
                if (!added) {
                  const groupNode = grid.current.api.getRowNode(
                    newSubstance.group,
                  )
                  setForm((form: any) => ({
                    ...form,
                    section_a: [...form.section_a, newSubstance],
                  }))
                  applyTransaction(grid.current.api, {
                    add: [newSubstance],
                    addIndex: groupNode.rowIndex + groupNode.data.count + 1,
                    update: [
                      { ...groupNode.data, count: groupNode.data.count + 1 },
                    ],
                  })
                  setTimeout(() => {
                    const rowEl = document.querySelector(
                      `.ag-row[row-id=${newSubstance.rowId}]`,
                    )
                    if (rowEl && !isInViewport(rowEl)) {
                      const top =
                        rowEl.getBoundingClientRect().top + window.scrollY
                      window.scroll({
                        behavior: 'smooth',
                        top,
                      })
                    }
                  }, 300)
                }
                setAddSubstanceModal(false)
              }}
            />
            <Typography className="text-right">
              <Button onClick={() => setAddSubstanceModal(false)}>Close</Button>
            </Typography>
          </Box>
        </Modal>
      )}
    </>
  )
}
