import { useMemo, useRef, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  IconButton,
  Modal,
  Typography,
} from '@mui/material'
import { CellValueChangedEvent, RowNode } from 'ag-grid-community'
import cx from 'classnames'
import { each, find, findIndex, includes, sortBy, union, uniqBy } from 'lodash'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { CreateBlend } from './CreateBlend'
import useGridOptions from './schema'

import { IoClose, IoExpand, IoInformationCircleOutline } from 'react-icons/io5'

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
      group.startsWith('Blends')
        ? [
            {
              display_name: 'Other',
              group,
              row_id: 'other-new_substance',
              rowType: 'control',
            },
          ]
        : [],
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

export default function SectionBCreate(props: any) {
  const { enqueueSnackbar } = useSnackbar()
  const { Section, TableProps, emptyForm, form, section, setForm, variant } =
    props

  const newNode = useRef<RowNode>()

  const [createdBlends, setCreatedBlends] = useState<Array<any>>([])

  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )
  const blends = useStore(
    (state) => getResults(state.cp_reports.blends.data).results,
  )

  const grid = useRef<any>()
  const [initialRowData] = useState(() => getRowData(form.section_b))

  const [addChemicalModal, setAddChemicalModal] = useState(false)
  const [createBlendModal, setCreateBlendModal] = useState(false)

  const chemicalsOptions = useMemo(() => {
    const data: Array<any> = []
    const chemicalsInForm = form.section_b.map(
      (chemical: any) => chemical.row_id,
    )
    each(substances, (substance) => {
      if (
        includes(substance.sections, 'B') &&
        !includes(chemicalsInForm, `substance_${substance.id}`)
      ) {
        data.push(Section.transformSubstance(substance))
      }
    })
    each(
      sortBy(uniqBy([...blends, ...createdBlends], 'id'), 'sort_order'),
      (blend) => {
        if (!includes(chemicalsInForm, `blend_${blend.id}`)) {
          data.push(Section.transformBlend(blend))
        }
      },
    )
    return data
  }, [substances, blends, form.section_b, createdBlends, Section])

  const gridOptions = useGridOptions({
    model: variant.model,
    onRemoveSubstance: (props: any) => {
      const removedSubstance = props.data
      const newData = [...form.section_b]
      const index = findIndex(
        form.section_b,
        (substance: any) => substance.row_id == removedSubstance.row_id,
      )
      if (index > -1) {
        const groupNode = grid.current.api.getRowNode(removedSubstance.group)
        newData.splice(index, 1)
        setForm((form: any) => ({ ...form, section_b: newData }))
        applyTransaction(grid.current.api, {
          remove: [props.data],
          update: [{ ...groupNode.data, count: groupNode.data.count - 1 }],
        })
      }
    },
    openAddChemicalModal: () => setAddChemicalModal(true),
    openCreateBlendModal: () => setCreateBlendModal(true),
    usages: emptyForm.usage_columns?.section_b || [],
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
        className="mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        rowData={initialRowData}
        Toolbar={({ enterFullScreen, exitFullScreen, fullScreen }: any) => {
          return (
            <div
              className={cx('mb-2 flex flex-col', {
                'px-4 pt-2': fullScreen,
              })}
            >
              <Typography className="mb-2" component="h2" variant="h6">
                {section.title}
              </Typography>
              <div className="flex items-center justify-between gap-x-4">
                <div>
                  {section.allowFullScreen && !fullScreen && (
                    <IconButton
                      color="primary"
                      onClick={() => {
                        enterFullScreen()
                      }}
                    >
                      <IoExpand />
                    </IconButton>
                  )}
                  {fullScreen && (
                    <div>
                      <IconButton
                        className="exit-fullscreen not-printable p-2 text-primary"
                        aria-label="exit fullscreen"
                        onClick={() => {
                          exitFullScreen()
                        }}
                      >
                        <IoClose size={32} />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        pinnedBottomRowData={[
          { display_name: 'TOTAL', rowType: 'total', tooltip: true },
          { row_id: 'control-add_chemical', rowType: 'control' },
          { row_id: 'control-add_blend', rowType: 'control' },
        ]}
        onCellValueChanged={(event: any) => {
          const usages = getUsagesOnCellValueChange(event)
          const newData = [...form.section_b]
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
            setForm({ ...form, section_b: newData })
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
      </Alert>
      {addChemicalModal && (
        <Modal
          aria-labelledby="add-substance-modal-title"
          open={addChemicalModal}
          onClose={() => setAddChemicalModal(false)}
          keepMounted
        >
          <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
            <Typography
              id="add-substance-modal-title"
              className="mb-4 text-typography-secondary"
              component="h2"
              variant="h6"
            >
              Select chemical
            </Typography>
            <Field
              Input={{ autoComplete: 'off' }}
              getOptionLabel={(option: any) => option.display_name}
              groupBy={(option: any) => option.group}
              options={chemicalsOptions}
              value={null}
              widget="autocomplete"
              onChange={(event: any, newChemical: any) => {
                if (document.activeElement) {
                  // @ts-ignore
                  document.activeElement.blur()
                }
                const added = find(
                  form.section_b,
                  (chemical) => chemical.row_id === newChemical.row_id,
                )
                if (!added) {
                  const groupNode = grid.current.api.getRowNode(
                    newChemical.group,
                  )
                  setForm((form: any) => ({
                    ...form,
                    section_b: [...form.section_b, newChemical],
                  }))
                  applyTransaction(grid.current.api, {
                    add: [newChemical],
                    addIndex: groupNode.rowIndex + groupNode.data.count + 1,
                    update: [
                      { ...groupNode.data, count: groupNode.data.count + 1 },
                    ],
                  })
                  const chemicalNode = grid.current.api.getRowNode(
                    newChemical.row_id,
                  )
                  newNode.current = chemicalNode
                }
                setAddChemicalModal(false)
              }}
            />
            <Typography className="text-right">
              <Button onClick={() => setAddChemicalModal(false)}>Close</Button>
            </Typography>
          </Box>
        </Modal>
      )}
      {createBlendModal && (
        <CreateBlend
          substances={substances}
          onClose={() => setCreateBlendModal(false)}
          onCreateBlend={(blend: any) => {
            const serializedBlend = Section.transformBlend(blend)

            const added = find(
              form.section_b,
              (chemical) => chemical.row_id === serializedBlend.row_id,
            )

            if (added) {
              const blendNode = grid.current.api.getRowNode(
                serializedBlend.row_id,
              )
              enqueueSnackbar(
                `Blend ${serializedBlend.name} already exists in the form.`,
                { variant: 'info' },
              )
              scrollToElement({
                callback: () => {
                  grid.current.api.flashCells({
                    rowNodes: [blendNode],
                  })
                },
                selectors: `.ag-row[row-id=${serializedBlend.row_id}]`,
              })
            } else {
              const groupNode = grid.current.api.getRowNode(
                serializedBlend.group,
              )
              setForm((form: any) => ({
                ...form,
                section_b: [...form.section_b, serializedBlend],
              }))
              setCreatedBlends((prev) => [...prev, blend])
              applyTransaction(grid.current.api, {
                add: [serializedBlend],
                addIndex: groupNode.rowIndex + groupNode.data.count + 1,
                update: [
                  {
                    ...groupNode.data,
                    count: groupNode.data.count + 1,
                  },
                ],
              })
              const blendNode = grid.current.api.getRowNode(
                serializedBlend.row_id,
              )
              newNode.current = blendNode
              enqueueSnackbar(
                <>
                  Blend{' '}
                  <span className="font-medium">{serializedBlend.name}</span>{' '}
                  created succesfuly.
                </>,
                { variant: 'info' },
              )
            }
          }}
        />
      )}
    </>
  )
}
