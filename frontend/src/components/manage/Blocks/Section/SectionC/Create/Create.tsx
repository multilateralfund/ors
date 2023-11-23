import { useMemo, useRef, useState } from 'react'

import { Box, Button, Modal, Typography } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { each, find, findIndex, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import useGridOptions from './schema'

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

export default function SectionCCreate(props: any) {
  const { Section, TableProps, form, index, setActiveSection, setForm } = props
  const newNode = useRef<RowNode>()
  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )

  const grid = useRef<any>()
  const [initialRowData] = useState(() => getRowData(form.section_c))

  const [addChimicalModal, setAddChimicalModal] = useState(false)

  const chimicalsOptions = useMemo(() => {
    const data: Array<any> = []
    const chimicalsInForm = form.section_c.map(
      (chimical: any) => chimical.rowId,
    )
    each(substances, (substance) => {
      if (
        includes(substance.sections, 'C') &&
        !includes(chimicalsInForm, `substance_${substance.id}`)
      ) {
        data.push(Section.transformSubstance(substance))
      }
    })
    return data
  }, [substances, form.section_c, Section])

  const gridOptions = useGridOptions({
    onRemoveSubstance: (props: any) => {
      const removedSubstance = props.data
      const newData = [...form.section_c]
      const index = findIndex(
        form.section_c,
        (substance: any) => substance.rowId == removedSubstance.rowId,
      )
      if (index > -1) {
        const groupNode = grid.current.api.getRowNode(removedSubstance.group)
        const removeGroup = groupNode.data.count === 1
        newData.splice(index, 1)
        setForm((form: any) => ({ ...form, section_c: newData }))
        if (removeGroup) {
          applyTransaction(grid.current.api, {
            remove: [
              groupNode.data,
              props.data,
              grid.current.api.getRowNode(`subtotal[${removedSubstance.group}]`)
                ?.data,
            ],
          })
        } else {
          applyTransaction(grid.current.api, {
            remove: [props.data],
            update: [{ ...groupNode.data, count: groupNode.data.count - 1 }],
          })
        }
      }
    },
    openAddChimicalModal: () => setAddChimicalModal(true),
  })

  return (
    <>
      <Table
        {...TableProps}
        className="three-groups mb-4'"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        pinnedBottomRowData={[
          { display_name: 'TOTAL', rowType: 'total' },
          { rowType: 'control' },
        ]}
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
                newNode.current = undefined
              },
            )
          }
        }}
      />
      <Typography className="italic" variant="body2">
        1. Edit by pressing double left-click or ENTER on a field.
      </Typography>
      <Typography className="italic" variant="body2">
        2. Indicate whether the prices are FOB or retail prices.
      </Typography>

      {addChimicalModal && (
        <Modal
          aria-labelledby="add-substance-modal-title"
          open={addChimicalModal}
          onClose={() => setAddChimicalModal(false)}
          keepMounted
        >
          <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
            <Typography
              id="add-substance-modal-title"
              className="mb-4 text-typography-secondary"
              component="h2"
              variant="h6"
            >
              Select chimical
            </Typography>
            <Field
              Input={{ autoComplete: 'off' }}
              getOptionLabel={(option: any) => option.display_name}
              groupBy={(option: any) => option.group}
              options={chimicalsOptions}
              value={null}
              widget="autocomplete"
              onChange={(event: any, newChimical: any) => {
                if (document.activeElement) {
                  // @ts-ignore
                  document.activeElement.blur()
                }
                const added = find(
                  form.section_c,
                  (chimical) => chimical.rowId === newChimical.rowId,
                )
                if (!added) {
                  const groupNode = grid.current.api.getRowNode(
                    newChimical.group,
                  )
                  const createGroup = !groupNode
                  const { group } = newChimical

                  setForm((form: any) => ({
                    ...form,
                    section_c: [...form.section_c, newChimical],
                  }))
                  if (createGroup) {
                    applyTransaction(grid.current.api, {
                      add: [
                        {
                          count: 1,
                          display_name: group,
                          group,
                          rowId: group,
                          rowType: 'group',
                        },
                        newChimical,
                        {
                          display_name: 'Sub-total',
                          group,
                          rowId: `subtotal[${group}]`,
                          rowType: 'subtotal',
                        },
                      ],
                      addIndex: grid.current.api.getLastDisplayedRow() + 1,
                    })
                  } else {
                    applyTransaction(grid.current.api, {
                      add: [newChimical],
                      addIndex: groupNode.rowIndex + groupNode.data.count + 1,
                      update: [
                        {
                          ...groupNode.data,
                          count: groupNode.data.count + 1,
                        },
                      ],
                    })
                  }
                  const substanceNode = grid.current.api.getRowNode(
                    newChimical.rowId,
                  )
                  newNode.current = substanceNode
                }
                setAddChimicalModal(false)
              }}
            />
            <Typography className="text-right">
              <Button onClick={() => setAddChimicalModal(false)}>Close</Button>
            </Typography>
          </Box>
        </Modal>
      )}
    </>
  )
}
