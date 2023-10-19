import { useEffect, useMemo, useRef, useState } from 'react'
import React from 'react'

import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  InputLabel,
  Modal,
  Typography,
} from '@mui/material'
import { CellValueChangedEvent, RowNode } from 'ag-grid-community'
import cx from 'classnames'
import {
  each,
  find,
  findIndex,
  get,
  includes,
  isObject,
  isString,
  sortBy,
  union,
  uniqBy,
} from 'lodash'
import dynamic from 'next/dynamic'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import api, { getResults } from '@ors/helpers/Api'
import {
  applyTransaction,
  debounce,
  parseNumber,
  scrollToElement,
} from '@ors/helpers/Utils/Utils'
import useStateWithPrev from '@ors/hooks/useStateWithPrev'
import useStore from '@ors/store'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoExpand } from '@react-icons/all-files/io5/IoExpand'
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle'

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

export default function SectionBCreate(props: any) {
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
  const { enqueueSnackbar } = useSnackbar()

  const [createdBlends, setCreatedBlends] = useState<Array<any>>([])

  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )
  const blends = useStore(
    (state) => getResults(state.cp_reports.blends.data).results,
  )

  const grid = useRef<any>()
  const [initialRowData] = useState(() => getRowData(form.section_b))

  const [blendForm, setBlendForm, prevBlendForm] = useStateWithPrev<any>({
    components: [],
    composition: '',
    other_names: '',
  })
  const [blendFormErrors, setBlendFormErrors] = useState<Record<string, any>>(
    {},
  )
  const [addChimicalModal, setAddChimicalModal] = useState(false)
  const [createBlendModal, setCreateBlendModal] = useState(false)

  const createBlendSubstancesOptions = useMemo(() => {
    const addedSubstances = blendForm.components.map(
      (component: any) => component?.id,
    )
    return substances.filter(
      (substance: any) => !includes(addedSubstances, substance.id),
    )
  }, [substances, blendForm])

  const chimicalsOptions = useMemo(() => {
    const data: Array<any> = []
    const chimicalsInForm = form.section_b.map(
      (chimical: any) => chimical.rowId,
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
        (substance: any) => substance.rowId == removedSubstance.rowId,
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
    usages: emptyForm.usage_columns.section_b || [],
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

  useEffect(() => {
    if (!createBlendModal) {
      setBlendForm({ components: [], composition: '', other_names: '' })
      setBlendFormErrors({})
    }
  }, [createBlendModal, setBlendForm])

  return (
    <>
      <Table
        {...TableProps}
        className="three-groups mb-4"
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        rowData={initialRowData}
        Toolbar={({ enterFullScreen, exitFullScreen, fullScreen }: any) => {
          return (
            <div
              className={cx('py-2', {
                'px-4': fullScreen,
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
                {section.allowFullScreen && !fullScreen && (
                  <div>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        enterFullScreen()
                      }}
                    >
                      <IoExpand />
                    </IconButton>
                  </div>
                )}
                {fullScreen && (
                  <div>
                    <IconButton
                      className="exit-fullscreen p-2 text-primary"
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
          )
        }}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        pinnedBottomRowData={[
          { display_name: 'TOTAL', rowType: 'total' },
          { rowType: 'control' },
        ]}
        onCellValueChanged={(event) => {
          const usages = getUsagesOnCellValueChange(event)
          const newData = [...form.section_b]
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
        2. When reporting blends/mixtures, reporting of controlled substances
        should not be duplicated. For the CP report, countries should report use
        of individual controlled substances and quantities of blends/mixtures
        used, separately, while ensuring that the amounts of controlled
        substances are not reported more than once.
      </Typography>
      <Typography className="italic" variant="body2">
        3. If a non-standard blend not listed in the above table is used, please
        indicate the percentage of each constituent controlled substance of the
        blend being reported in the remarks column.
      </Typography>
      <Typography className="italic" variant="body2">
        4. Uses in other sectors that do not fall specifically within the listed
        sectors in the table.
      </Typography>
      <Typography className="italic" variant="body2">
        5. Provide explanation if total sector use and consumption
        (import-export+production) is different (e.g, stockpiling).
      </Typography>
      <Typography className="italic" variant="body2">
        6. If break-down of consumption in manufacturing is not available,
        information in total can be provided.
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
                  form.section_b,
                  (chimical) => chimical.rowId === newChimical.rowId,
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
                    newChimical.rowId,
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
        <Modal
          aria-labelledby="create-blend-modal-title"
          open={createBlendModal}
          onClose={() => setCreateBlendModal(false)}
          keepMounted
        >
          <div className="h-full w-full p-4 absolute-center">
            <Box className="flex h-full flex-col justify-between overflow-scroll">
              <div>
                <Typography
                  id="create-blend-modal-title"
                  className="mb-4 text-typography-secondary"
                  component="h2"
                  variant="h6"
                >
                  Create blend
                </Typography>
                <Field
                  InputLabel={{ label: 'Blend description' }}
                  error={!!blendFormErrors.composition}
                  helperText={blendFormErrors.composition}
                  onChange={(event: any) => {
                    debounce(function updateBlendDescription() {
                      setBlendForm({
                        ...prevBlendForm.current,
                        composition: event.target.value,
                      })
                    })
                  }}
                />
                <Field
                  InputLabel={{ label: 'Blend other names' }}
                  error={!!blendFormErrors.other_names}
                  helperText={blendFormErrors.other_names}
                  onChange={(event: any) => {
                    debounce(function updateBlendName() {
                      setBlendForm({
                        ...prevBlendForm.current,
                        other_names: event.target.value,
                      })
                    })
                  }}
                />
                <InputLabel className="mb-2">Blend composition</InputLabel>
                {blendForm.components.map((component: any, index: number) => (
                  <React.Fragment key={component?.substance_id || index}>
                    <div className="mb-4 grid grid-cols-[1fr_1fr_auto_auto] items-center gap-x-4">
                      <Field
                        FieldProps={{ className: 'w-full mb-0' }}
                        Input={{ placeholder: 'Select substance...' }}
                        getOptionLabel={(option: any) => option.name}
                        groupBy={(option: any) => option.group}
                        label="Substance"
                        options={createBlendSubstancesOptions}
                        value={component}
                        widget="autocomplete"
                        onChange={(_: any, value: any) => {
                          const components = [...blendForm.components]
                          if (!value) {
                            components.splice(index, 1)
                          } else {
                            components[index] = {
                              ...value,
                              percentage: components[index]?.percentage || 0,
                            }
                          }
                          setBlendForm({ ...blendForm, components })
                        }}
                      />
                      <Field
                        FieldProps={{ className: 'mb-0' }}
                        defaultValue={component?.component_name || ''}
                        disabled={!component}
                        label="Compnent name"
                        onChange={(event: any) => {
                          debounce(function updateBlendComponentName() {
                            const components = [
                              ...prevBlendForm.current.components,
                            ]
                            components[index].component_name =
                              event.target.value
                            setBlendForm({
                              ...prevBlendForm.current,
                              components,
                            })
                          })
                        }}
                      />
                      <TextWidget
                        defaultValue={component?.percentage || 0}
                        disabled={!component}
                        label="Percentage"
                        type="number"
                        InputProps={{
                          inputProps: {
                            lang: 'en',
                            max: 100,
                            min: 0,
                            step: 1,
                          },
                        }}
                        onChange={(event: any) => {
                          debounce(function updateBlendComponentPercentage() {
                            const components = [
                              ...prevBlendForm.current.components,
                            ]
                            components[index] = {
                              ...(components[index] || {}),
                              percentage: event.target.value || 0,
                            }
                            setBlendForm({
                              ...prevBlendForm.current,
                              components,
                            })
                          })
                        }}
                      />
                      <div>
                        <IconButton
                          color="error"
                          onClick={() => {
                            const components = [...blendForm.components]
                            components.splice(index, 1)
                            setBlendForm({ ...blendForm, components })
                          }}
                        >
                          <IoRemoveCircle size="1rem" />
                        </IconButton>
                      </div>
                    </div>
                    <Collapse in={isObject(blendFormErrors.components)}>
                      {isObject(blendFormErrors.components) &&
                        isString(get(blendFormErrors.components, index)) && (
                          <Alert className="mb-4" severity="error">
                            {get(blendFormErrors.components, index)}
                          </Alert>
                        )}
                    </Collapse>
                  </React.Fragment>
                ))}
                <Button
                  className="mb-4"
                  onClick={() => {
                    setBlendForm({
                      ...blendForm,
                      components: [...blendForm.components, null],
                    })
                  }}
                >
                  + Add component
                </Button>
                <Collapse
                  in={
                    isString(blendFormErrors.components) &&
                    !!blendFormErrors.components
                  }
                >
                  {isString(blendFormErrors.components) && (
                    <Alert severity="error">{blendFormErrors.components}</Alert>
                  )}
                </Collapse>
              </div>
              <div>
                <Typography className="flex justify-end gap-x-2">
                  <Button onClick={() => setCreateBlendModal(false)}>
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        const blend = await api('api/blends/create/', {
                          data: {
                            ...blendForm,
                            components: blendForm.components.map(
                              (component: any) => ({
                                component_name: component?.component_name || '',
                                percentage:
                                  parseNumber(component?.percentage) || 0,
                                substance_id: component?.id || null,
                              }),
                            ),
                          },
                          method: 'POST',
                        })

                        const deserializedBlend = Section.transformBlend(blend)

                        const added = find(
                          form.section_b,
                          (chimical) =>
                            chimical.rowId === deserializedBlend.rowId,
                        )

                        if (added) {
                          const blendNode = grid.current.api.getRowNode(
                            deserializedBlend.rowId,
                          )
                          enqueueSnackbar(
                            `Blend ${deserializedBlend.name} already exists in the form.`,
                            { variant: 'info' },
                          )
                          scrollToElement(
                            `.ag-row[row-id=${deserializedBlend.rowId}]`,
                            () => {
                              grid.current.api.flashCells({
                                rowNodes: [blendNode],
                              })
                            },
                          )
                        } else {
                          const groupNode = grid.current.api.getRowNode(
                            deserializedBlend.group,
                          )
                          setForm((form: any) => ({
                            ...form,
                            section_b: [...form.section_b, deserializedBlend],
                          }))
                          setCreatedBlends((prev) => [...prev, blend])
                          applyTransaction(grid.current.api, {
                            add: [deserializedBlend],
                            addIndex:
                              groupNode.rowIndex + groupNode.data.count + 1,
                            update: [
                              {
                                ...groupNode.data,
                                count: groupNode.data.count + 1,
                              },
                            ],
                          })
                          const blendNode = grid.current.api.getRowNode(
                            deserializedBlend.rowId,
                          )
                          newNode.current = blendNode
                          enqueueSnackbar(
                            <>
                              Blend{' '}
                              <span className="font-medium">
                                {deserializedBlend.name}
                              </span>{' '}
                              created succesfuly.
                            </>,
                            { variant: 'info' },
                          )
                        }
                        setBlendFormErrors({})
                        setCreateBlendModal(false)
                      } catch (error) {
                        if (error.status === 400) {
                          setBlendFormErrors({
                            ...(await error.json()),
                          })
                          enqueueSnackbar(
                            <>Please make sure all the inputs are correct.</>,
                            { variant: 'error' },
                          )
                        } else {
                          setBlendFormErrors({})
                          enqueueSnackbar(
                            <>Unexpected error, we are working on it.</>,
                            {
                              variant: 'error',
                            },
                          )
                        }
                      }
                    }}
                  >
                    Submit
                  </Button>
                </Typography>
              </div>
            </Box>
          </div>
        </Modal>
      )}
    </>
  )
}
