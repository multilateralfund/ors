import { useMemo, useRef, useState } from 'react'
import React from 'react'

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
import dynamic from 'next/dynamic'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Footnote from '@ors/components/ui/Footnote/Footnote'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { CreateBlend } from './CreateBlend'
import useGridOptions from './schema'

import { AiFillFilePdf } from 'react-icons/ai'
import {
  IoClose,
  IoDownloadOutline,
  IoExpand,
  IoInformationCircleOutline,
} from 'react-icons/io5'

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

export default function SectionBCreate(props: any) {
  const { enqueueSnackbar } = useSnackbar()
  const {
    Section,
    TableProps,
    emptyForm,
    form,
    index,
    section,
    setActiveSection,
    setForm,
  } = props

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

  const [addChimicalModal, setAddChimicalModal] = useState(false)
  const [createBlendModal, setCreateBlendModal] = useState(false)

  const chimicalsOptions = useMemo(() => {
    const data: Array<any> = []
    const chimicalsInForm = form.section_b.map(
      (chimical: any) => chimical.row_id,
    )
    each(substances, (substance) => {
      if (
        includes(substance.sections, 'B') &&
        !includes(chimicalsInForm, `substance_${substance.id}`)
      ) {
        data.push(Section.transformSubstance(substance))
      }
    })
    each(
      sortBy(uniqBy([...blends, ...createdBlends], 'id'), 'sort_order'),
      (blend) => {
        if (!includes(chimicalsInForm, `blend_${blend.id}`)) {
          data.push(Section.transformBlend(blend))
        }
      },
    )
    return data
  }, [substances, blends, form.section_b, createdBlends, Section])

  const gridOptions = useGridOptions({
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
    openAddChimicalModal: () => setAddChimicalModal(true),
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
        className="three-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        rowData={initialRowData}
        Toolbar={({
          enterFullScreen,
          exitFullScreen,
          fullScreen,
          onPrint,
          print,
        }: any) => {
          return (
            <div
              className={cx('mb-2 flex flex-col', {
                'px-4 pt-2': fullScreen && !print,
              })}
            >
              <Typography className="mb-2" component="h2" variant="h6">
                {section.title}
              </Typography>
              <div className="flex items-center justify-between gap-x-4">
                <Button
                  variant="contained"
                  onClick={() => setCreateBlendModal(true)}
                >
                  Create blend
                </Button>
                <div>
                  {!fullScreen && (
                    <Dropdown
                      color="primary"
                      label={<IoDownloadOutline />}
                      icon
                    >
                      <Dropdown.Item onClick={onPrint}>
                        <div className="flex items-center gap-x-2">
                          <AiFillFilePdf className="fill-red-700" size={24} />
                          <span>PDF</span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown>
                  )}
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
          { rowType: 'control' },
        ]}
        onCellValueChanged={(event) => {
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
          When reporting blends/mixtures, reporting of controlled substances
          should not be duplicated. For the CP report, countries should report
          use of individual controlled substances and quantities of
          blends/mixtures used, separately, while ensuring that the amounts of
          controlled substances are not reported more than once.
        </Footnote>
        <Footnote id="2">
          Provide explanation if total sector use and consumption
          (import-export+production) is different (e.g, stockpiling).
        </Footnote>
        <Footnote id="3" index="*">
          Tentative/best estimates.
        </Footnote>
      </Alert>
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
                  form.section_b,
                  (chimical) => chimical.row_id === newChimical.row_id,
                )
                if (!added) {
                  const groupNode = grid.current.api.getRowNode(
                    newChimical.group,
                  )
                  setForm((form: any) => ({
                    ...form,
                    section_b: [...form.section_b, newChimical],
                  }))
                  applyTransaction(grid.current.api, {
                    add: [newChimical],
                    addIndex: groupNode.rowIndex + groupNode.data.count + 1,
                    update: [
                      { ...groupNode.data, count: groupNode.data.count + 1 },
                    ],
                  })
                  const chimicalNode = grid.current.api.getRowNode(
                    newChimical.row_id,
                  )
                  newNode.current = chimicalNode
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
      {createBlendModal && (
        <CreateBlend
          substances={substances}
          onClose={() => setCreateBlendModal(false)}
          onCreateBlend={(blend: any) => {
            const serializedBlend = Section.transformBlend(blend)

            const added = find(
              form.section_b,
              (chimical) => chimical.row_id === serializedBlend.row_id,
            )

            if (added) {
              const blendNode = grid.current.api.getRowNode(
                serializedBlend.row_id,
              )
              enqueueSnackbar(
                `Blend ${serializedBlend.name} already exists in the form.`,
                { variant: 'info' },
              )
              scrollToElement(
                `.ag-row[row-id=${serializedBlend.row_id}]`,
                () => {
                  grid.current.api.flashCells({
                    rowNodes: [blendNode],
                  })
                },
              )
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
