import { useMemo, useRef, useState } from 'react'

import { Alert, Box, Button, Modal, Typography } from '@mui/material'
import { CellValueChangedEvent, RowNode } from 'ag-grid-community'
import { each, find, findIndex, includes, union } from 'lodash'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

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
          row_id: group,
          rowType: 'group',
        },
      ],
      dataByGroup[group],
      [
        {
          display_name: 'Sub-total',
          group,
          row_id: `subtotal[${group}]`,
          rowType: 'subtotal',
        },
      ],
    )
  })
  return rowData
}

export default function SectionACreate(props: any) {
  const {
    Section,
    TableProps,
    emptyForm,
    form,
    index,
    setActiveSection,
    setForm,
  } = props
  const newNode = useRef<RowNode>()

  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )
  const grid = useRef<any>()
  const [initialRowData] = useState(() => getRowData(form.section_a))
  const [addSubstanceModal, setAddSubstanceModal] = useState(false)

  const substancesOptions = useMemo(() => {
    const data: Array<any> = []
    const substancesInForm = form.section_a.map(
      (substance: any) => substance.row_id,
    )
    each(substances, (substance) => {
      if (
        includes(['Annex C, Group I'], substance.group) &&
        includes(substance.sections, 'A') &&
        !includes(substancesInForm, `substance_${substance.id}`)
      ) {
        data.push(Section?.transformSubstance(substance))
      }
    })
    return data
  }, [substances, form.section_a, Section])

  const gridOptions = useGridOptions({
    onRemoveSubstance: (props: any) => {
      const removedSubstance = props.data
      const newData = [...form.section_a]
      const index = findIndex(
        form.section_a,
        (substance: any) => substance.row_id == removedSubstance.row_id,
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
    usages: emptyForm.usage_columns?.section_a || [],
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
      <Alert className="mb-4" icon={false} severity="info">
        <Typography>
          Edit by pressing double left-click or ENTER on a field.
        </Typography>
      </Alert>
      <Table
        {...TableProps}
        className="three-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        pinnedBottomRowData={[
          {
            display_name: 'TOTAL',
            row_id: 'total',
            rowType: 'total',
            tooltip: true,
          },
          { row_id: 'control', rowType: 'control' },
        ]}
        onCellValueChanged={(event) => {
          const usages = getUsagesOnCellValueChange(event)
          const newData = [...form.section_a]
          const index = findIndex(
            newData,
            (row: any) => row.row_id == event.data.row_id,
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
        onFirstDataRendered={() => setActiveSection(index)}
        onGridReady={() => {
          if (!initialRowData.length) {
            setActiveSection(index)
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
      <Alert icon={<IoInformationCircleOutline size={24} />} severity="info">
        <Footnotes />
        {/* <Footnote id="1">
          Where the data involves a blend of two or more substances, the
          quantities of individual components of controlled substances must be
          indicated separately.
        </Footnote>
        <Footnote id="2">
          Provide explanation if total sector use and consumption
          (import-export+production) is different (e.g, stockpiling).
        </Footnote> */}
      </Alert>
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
                  (substance) => substance.row_id === newSubstance.row_id,
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
                  const substanceNode = grid.current.api.getRowNode(
                    newSubstance.row_id,
                  )
                  newNode.current = substanceNode
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
