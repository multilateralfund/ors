import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Button,
  Collapse,
  InputLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { ColDef, GridApi, RowNode } from 'ag-grid-community'
import cx from 'classnames'
import { find, findIndex, includes, isString } from 'lodash'
import { useSnackbar } from 'notistack'

import { NON_EDITABLE_ROWS } from '@ors/config/Table/columnsDef/settings'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import api from '@ors/helpers/Api/_api'
import { applyTransaction } from '@ors/helpers/Utils/Utils'
import useStateWithPrev from '@ors/hooks/useStateWithPrev'
import { useStore } from '@ors/store'

import { IoAlertCircle, IoInformationCircle, IoTrash } from 'react-icons/io5'

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
                  <Typography>{substance?.name}</Typography>
                  <Typography>{component.percentage}%</Typography>
                </React.Fragment>
              )
            })}
          </div>
        </>
      }
    >
      <Button
        className="rounded border border-solid border-primary p-1 text-sm"
        onClick={onClick}
      >
        {blend.name}
      </Button>
    </Tooltip>
  )
}

export function CreateBlend({ closeModal, onCreateBlend, substances }: any) {
  const { enqueueSnackbar } = useSnackbar()
  const fetchBlends = useStore((state) => state.cp_reports.fetchBlends)

  const grid = useRef<any>()
  const newNode = useRef<RowNode>()
  const newNodeIndex = useRef(0)

  const [form, setForm, prevForm] = useStateWithPrev<any>({
    components: [],
    composition: '',
    other_names: '',
  })
  const [errors, setErrors] = useState<Record<string, any>>({})

  useEffect(() => {
    async function getNextCustomMixName() {
      try {
        const data = await api('api/blends/next-cust-mix-name/')
        setForm({
          ...prevForm.current,
          other_names: data.name,
        })
      } catch (e) {
        setErrors({
          components: "Couldn't fetch the next custom mix name.",
        })
      }
    }

    getNextCustomMixName()
  }, [prevForm, setForm])

  const [similarBlends, setSimilarBlends] = useState<Array<object>>([])
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
        'ag-cell-hashed theme-dark:bg-gray-900/40': includes(
          props.data.excluded_usages || [],
          props.colDef.id,
        ),
        'ag-flex-cell': props.data.rowType === 'control',
        'ag-text-right': !includes(['substance'], props.colDef.field),
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
    <>
      <div className="modal-content">
        <Alert
          className="mb-4 bg-mlfs-bannerColor"
          icon={<IoInformationCircle size={24} />}
          severity="info"
        >
          <Typography>
            If a non-standard blend not listed in the table is used, please
            indicate the percentage of each constituent controlled substance of
            the blend being reported in the remarks column.
          </Typography>
        </Alert>
        <div className="grid grid-cols-2 gap-x-4">
          <Field
            InputLabel={{ label: 'Blend name' }}
            disabled={true}
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
          <Field
            InputLabel={{ label: 'Blend composition' }}
            disabled={true}
            error={!!errors.composition}
            helperText={errors.composition}
            value={form.composition}
          />
        </div>
        <InputLabel className="mb-2 inline-flex items-center gap-2">
          <span>Add blend composition</span>
        </InputLabel>
        <Table
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          enablePagination={false}
          errors={errors?.components}
          gridRef={grid}
          pinnedBottomRowData={[{ rowType: 'total', substance: 'TOTAL' }]}
          rowData={null}
          suppressCellFocus={false}
          suppressLoadingOverlay={true}
          suppressNoRowsOverlay={true}
          withSeparators={true}
          columnDefs={[
            {
              cellRendererParams: (props: any) => ({
                options: !props.data.mandatory && !props.data.rowType && (
                  <IoTrash
                    className="cursor-pointer fill-mlfs-purple"
                    size={20}
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
                      // Check if components array is empty and reset fields
                      if (newComponents.length === 0) {
                        setForm({
                          ...prevForm.current,
                          composition: '',
                          other_names: '',
                        })
                        setSimilarBlends([])
                      }
                    }}
                  />
                ),
              }),
              maxWidth: 40,
              showRowError: false,
            },
            {
              cellEditor: 'agSelectCellEditor',
              cellEditorParams: {
                Input: { placeholder: 'Select substance...' },
                getOptionLabel: (option: any) => option.name,
                groupBy: (option: any) => option.group,
                openOnFocus: true,
                options,
              },
              cellRenderer: (props: any) => {
                return (
                  <AgCellRenderer
                    {...props}
                    value={
                      !props.data.rowType ? props.value?.name : props.value
                    }
                  />
                )
              },
              field: 'substance',
              flex: 1,
              headerClass: 'ag-text-left',
              headerComponent: (props: { api: GridApi<any> }) => {
                return (
                  <span className="flex w-full items-center justify-between">
                    <div>Substance</div>
                    <Button
                      className="rounded-lg border-[1.1px] border-solid border-primary px-2 py-1 text-xs"
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
                      Add new
                    </Button>
                  </span>
                )
              },
              headerName: 'Substance',
              minWidth: 200,
              showRowError: true,
              singleClickEdit: true,
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
        <Collapse in={isString(errors.components) && !!errors.components}>
          {isString(errors.components) && (
            <Alert icon={<IoAlertCircle />} severity="error">
              {errors.components}
            </Alert>
          )}
        </Collapse>
        {similarBlends.length > 0 && (
          <table className="mt-2 w-full text-base">
            <thead>
              <tr>
                <th className="flex">
                  {similarBlends.length} blend(s) found in the system. Click on
                  a blend name to use it
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="flex justify-between">
                  <span>Suggested blends</span>
                  <div className="flex gap-x-2">
                    {similarBlends.map((blend: any) => (
                      <SimilarBlend
                        key={blend.id}
                        blend={blend}
                        substances={substances}
                        onClick={() => selectSimilarBlend(blend)}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        <Button
          className="mt-2 rounded-lg border-[1.5px] border-solid border-primary px-3 py-2.5 text-base"
          onClick={async () => {
            try {
              const similarBlends = await api('api/blends/similar', {
                data: {
                  components: form.components,
                },
                method: 'post',
              })
              const hasSimilarBlends = similarBlends.length > 0
              setSimilarBlends(similarBlends)
              enqueueSnackbar(
                hasSimilarBlends
                  ? "Found similar blends. Please check the list below 'Blend composition'!"
                  : 'There are no similar blends!',
                {
                  variant: 'info',
                },
              )
            } catch (error) {
              setSimilarBlends([])
              const message = await error.json()
              if (message.components) {
                enqueueSnackbar(message.components, {
                  variant: 'error',
                })
              }
            }
          }}
        >
          Show similar blends
        </Button>
      </div>
      <div className="modal-action mt-8">
        <Typography className="flex gap-x-2">
          <Button
            className="text-base"
            color="secondary"
            variant="contained"
            onClick={async () => {
              try {
                const blend = await api('api/blends/create/', {
                  data: form,
                  method: 'POST',
                })
                await fetchBlends()
                setForm({
                  ...prevForm.current,
                  composition: blend.composition,
                })
                onCreateBlend(blend)
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
          <Button
            className="rounded-lg border-[1.5px] border-solid border-transparent bg-[#f2f2f2] p-2.5 text-base text-[#4d4d4d] hover:border-primary"
            onClick={closeModal}
          >
            Close
          </Button>
        </Typography>
      </div>
    </>
  )
}
