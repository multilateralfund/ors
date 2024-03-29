import { useMemo, useRef, useState } from 'react'
import React from 'react'

import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  InputLabel,
  Modal,
  Tooltip,
  Typography,
} from '@mui/material'
import { ColDef, RowNode } from 'ag-grid-community'
import cx from 'classnames'
import { find, findIndex, includes, isString } from 'lodash'
import { useSnackbar } from 'notistack'

import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import api from '@ors/helpers/Api/Api'
import { applyTransaction } from '@ors/helpers/Utils/Utils'
import useStateWithPrev from '@ors/hooks/useStateWithPrev'

import {
  IoAddCircleSharp,
  IoInformationCircleOutline,
  IoRefresh,
  IoTrash,
} from 'react-icons/io5'

function SimilarBlend({ blend, onClick, substances }: any) {
  return (
    <Tooltip
      key={blend.id}
      placement="top"
      title={
        <>
          <div className="mb-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <Typography className="mb-2">Substance</Typography>
            <Typography className="mb-2">Percentage</Typography>
            {blend.components.map((component: any) => {
              const substance = find(
                substances,
                (substance) => substance.id === component.substance_id,
              )

              return (
                <React.Fragment key={component.substance_id}>
                  <Typography>{substance.name}</Typography>
                  <Typography>{component.percentage}%</Typography>
                </React.Fragment>
              )
            })}
          </div>
        </>
      }
    >
      <Button onClick={onClick}>{blend.name}</Button>
    </Tooltip>
  )
}

export function CreateBlend({ onClose, onCreateBlend, substances }: any) {
  const { enqueueSnackbar } = useSnackbar()

  const grid = useRef<any>()
  const newNode = useRef<RowNode>()
  const newNodeIndex = useRef(0)

  const [form, setForm, prevForm] = useStateWithPrev<any>({
    components: [],
    composition: '',
    other_names: '',
  })
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [similarBlends, setSimilarBlends] = useState<Record<
    string,
    Array<any>
  > | null>({
    default: [],
    similar: [],
  })
  const options = useMemo(() => {
    const addedSubstances = form.components.map(
      (component: any) => component.substance?.id,
    )
    return substances.filter(
      (substance: any) => !includes(addedSubstances, substance.id),
    )
  }, [substances, form])

  const [defaultColDef] = useState<ColDef>({
    autoHeight: true,
    cellClass: (props: any) => {
      return cx({
        'ag-flex-cell': props.data.rowType === 'control',
        'ag-text-right': !includes(['substance'], props.colDef.field),
        'bg-gray-100 theme-dark:bg-gray-900/40': includes(
          props.data.excluded_usages || [],
          props.colDef.id,
        ),
        'bg-mui-box-background': includes(['substance'], props.colDef.field),
      })
    },
    editable: (props) => {
      if (
        includes(NON_EDITABLE_ROWS, props.data.rowType) ||
        includes(props.data.excluded_usages || [], props.colDef.id)
      ) {
        return false
      }
      return true
    },
    headerClass: 'ag-text-center',
    minWidth: 120,
    wrapText: true,
  })

  function selectSimilarBlend(blend: any) {
    const components = blend.components.map((component: any, index: number) => {
      const substance =
        find(
          substances,
          (substance) => substance.id === component.substance_id,
        ) || null

      return {
        ...component,
        row_id: `${index}`,
        substance,
      }
    })

    setForm({
      components,
      composition: blend.composition,
      other_names: blend.name,
    })
    grid.current.api.setRowData(components)
  }

  return (
    <Modal
      aria-labelledby="create-blend-modal-title"
      open={true}
      onClose={onClose}
    >
      <div className="h-full max-h-[768px] w-full max-w-[768px] p-4 absolute-center">
        <Box className="flex h-full flex-col justify-between overflow-y-auto">
          <div className="modal-content">
            <Typography
              id="create-blend-modal-title"
              className="mb-4 text-typography-secondary"
              component="h2"
              variant="h6"
            >
              Create new blend
            </Typography>
            <Alert
              className="mb-4"
              icon={<IoInformationCircleOutline size={24} />}
              severity="info"
            >
              <Typography>
                If a non-standard blend not listed in the table is used, please
                indicate the percentage of each constituent controlled substance
                of the blend being reported in the remarks column.
              </Typography>
            </Alert>
            <Field
              InputLabel={{ label: 'Blend description' }}
              error={!!errors.composition}
              helperText={errors.composition}
              value={form.composition}
              onChange={(event: any) => {
                setForm({
                  ...prevForm.current,
                  composition: event.target.value,
                })
              }}
            />
            <Field
              InputLabel={{ label: 'Blend other names' }}
              error={!!errors.other_names}
              helperText={errors.other_names}
              value={form.other_names}
              onChange={(event: any) => {
                setForm({
                  ...prevForm.current,
                  other_names: event.target.value,
                })
              }}
            />
            <InputLabel className="mb-2 inline-flex items-center gap-2">
              <span>Blend composition</span>
              <Tooltip placement="top" title="Similar blends">
                <IconButton
                  color="primary"
                  onClick={async () => {
                    try {
                      const defaultSimilarBlends = await api(
                        'api/blends/similar',
                        {
                          data: {
                            components: form.components,
                          },
                          method: 'post',
                        },
                      )
                      const sameSimilarBlends = await api(
                        'api/blends/similar',
                        {
                          data: {
                            components: form.components,
                            same_substances: true,
                          },
                          method: 'post',
                        },
                      )
                      const hasSimilarBlends =
                        defaultSimilarBlends.length > 0 ||
                        sameSimilarBlends.length > 0
                      setSimilarBlends({
                        default: defaultSimilarBlends,
                        same: sameSimilarBlends,
                      })
                      enqueueSnackbar(
                        hasSimilarBlends
                          ? "Found similar blends. Please check the list below 'Blend composition'!"
                          : 'There are no similar blends!',
                        {
                          variant: 'info',
                        },
                      )
                    } catch (error) {
                      setSimilarBlends(null)
                      const message = await error.json()
                      if (message.components) {
                        enqueueSnackbar(message.components, {
                          variant: 'error',
                        })
                      }
                    }
                  }}
                >
                  <IoRefresh size="1rem" />
                </IconButton>
              </Tooltip>
            </InputLabel>
            <Table
              className="mb-4"
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
              enableCellChangeFlash={true}
              enablePagination={false}
              errors={errors?.components}
              gridRef={grid}
              rowData={null}
              suppressCellFocus={false}
              suppressLoadingOverlay={true}
              suppressNoRowsOverlay={true}
              withSeparators={true}
              columnDefs={[
                {
                  cellEditor: 'agSelectCellEditor',
                  cellEditorParams: {
                    Input: { placeholder: 'Select substance...' },
                    getOptionLabel: (option: any) => option.name,
                    groupBy: (option: any) => option.group,
                    options,
                  },
                  cellRenderer: (props: any) => {
                    if (props.data.rowType === 'control') {
                      return (
                        <Button
                          className="w-full"
                          variant="contained"
                          onClick={() => {
                            const row_id = `${newNodeIndex.current}`
                            const newComponent = {
                              component_name: '',
                              percentage: 0,
                              row_id,
                              substance: null,
                              substance_id: null,
                            }
                            setForm({
                              ...prevForm.current,
                              components: [...form.components, newComponent],
                            })
                            applyTransaction(props.api, {
                              add: [newComponent],
                            })
                            const componentNode = grid.current.api.getRowNode(
                              newComponent.row_id,
                            )
                            newNode.current = componentNode
                            newNodeIndex.current = newNodeIndex.current + 1
                          }}
                        >
                          + Add component
                        </Button>
                      )
                    }
                    return (
                      <AgCellRenderer
                        {...props}
                        value={
                          !props.data.rowType ? props.value?.name : props.value
                        }
                      />
                    )
                  },
                  cellRendererParams: (props: any) => ({
                    options: !props.data.mandatory && !props.data.rowType && (
                      <>
                        <Dropdown.Item
                          onClick={() => {
                            props.api.startEditingCell({
                              colKey: props.column.colId,
                              rowIndex: props.node.rowIndex,
                            })
                          }}
                        >
                          <div className="flex items-center gap-x-2">
                            <IoAddCircleSharp
                              className="fill-primary"
                              size={20}
                            />
                            <span>Add substance</span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => {
                            const newComponents = form.components
                            const index = findIndex(
                              newComponents,
                              (component: any) =>
                                component.row_id === props.data.row_id,
                            )
                            newComponents.splice(index, 1)
                            setForm({
                              ...prevForm.current,
                              components: newComponents,
                            })
                            applyTransaction(props.api, {
                              remove: [props.data],
                            })
                          }}
                        >
                          <div className="flex items-center gap-x-2">
                            <IoTrash className="fill-error" size={20} />
                            <span>Delete</span>
                          </div>
                        </Dropdown.Item>
                      </>
                    ),
                  }),
                  field: 'substance',
                  flex: 1,
                  headerClass: 'ag-text-left',
                  headerName: 'Substance',
                  minWidth: 200,
                  showRowError: true,
                },
                {
                  cellEditor: 'agTextCellEditor',
                  field: 'component_name',
                  headerName: 'Component name',
                  initialWidth: 200,
                  minWidth: 200,
                  orsAggFunc: 'sumTotal',
                },
                {
                  cellEditor: 'agNumberCellEditor',
                  cellEditorParams: {
                    max: 100,
                    min: 0,
                  },
                  dataType: 'number',
                  field: 'percentage',
                  headerName: 'Percentage',
                  initialWidth: 120,
                  minWidth: 120,
                  orsAggFunc: 'sumTotal',
                },
              ]}
              getRowId={(props: any) => {
                return props.data.row_id
              }}
              pinnedBottomRowData={[
                { rowType: 'total', substance: 'TOTAL' },
                { rowType: 'control' },
              ]}
              onCellValueChanged={(event) => {
                const newComponents = form.components
                const index = findIndex(
                  newComponents,
                  (component: any) => component.row_id === event.data.row_id,
                )
                newComponents.splice(index, 1, event.data)
                setForm({
                  ...prevForm.current,
                  components: newComponents.map((component: any) => ({
                    ...component,
                    substance_id: component.substance?.id || null,
                  })),
                })
              }}
              onRowDataUpdated={() => {
                if (newNode.current) {
                  grid.current.api.flashCells({
                    rowNodes: [newNode.current],
                  })
                  newNode.current = undefined
                }
              }}
            />
            {(!!similarBlends?.default?.length ||
              !!similarBlends?.same?.length) && (
              <div className="similar-blends grid grid-cols-2 gap-4">
                <div>
                  <Typography className="mb-2 font-semibold">
                    Blends same composition
                  </Typography>
                  {similarBlends.same.map((blend: any) => (
                    <SimilarBlend
                      key={blend.id}
                      blend={blend}
                      substances={substances}
                      onClick={() => selectSimilarBlend(blend)}
                    />
                  ))}
                </div>
                <div>
                  <Typography className="mb-2 font-semibold">
                    Blends similar composition
                  </Typography>
                  {similarBlends.default.map((blend: any) => (
                    <SimilarBlend
                      key={blend.id}
                      blend={blend}
                      substances={substances}
                      onClick={() => selectSimilarBlend(blend)}
                    />
                  ))}
                </div>
              </div>
            )}
            <Collapse in={isString(errors.components) && !!errors.components}>
              {isString(errors.components) && (
                <Alert severity="error">{errors.components}</Alert>
              )}
            </Collapse>
          </div>
          <div className="modal-action mt-8">
            <Typography className="flex justify-end gap-x-2">
              <Button onClick={() => onClose()}>Close</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    const blend = await api('api/blends/create/', {
                      data: form,
                      method: 'POST',
                    })
                    onCreateBlend(blend)
                    onClose()
                  } catch (error) {
                    if (error.status === 400) {
                      setErrors({
                        ...(await error.json()),
                      })
                      enqueueSnackbar(
                        <>Please make sure all the inputs are correct.</>,
                        { variant: 'error' },
                      )
                    } else {
                      setErrors({})
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
  )
}
