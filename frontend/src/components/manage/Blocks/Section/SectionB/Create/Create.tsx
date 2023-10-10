import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Box,
  Button,
  IconButton,
  InputLabel,
  Modal,
  Typography,
} from '@mui/material'
import { CellValueChangedEvent } from 'ag-grid-community'
import cx from 'classnames'
import { each, find, findIndex, includes, isNil, union } from 'lodash'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import api, { getResults } from '@ors/helpers/Api'
import { applyTransaction, isInViewport } from '@ors/helpers/Utils/Utils'
import useStore from '@ors/store'

import useGridOptions from './schema'

import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoRemoveCircle } from '@react-icons/all-files/io5/IoRemoveCircle'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 300)
}

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
    emptyForm,
    exitFullScreen,
    form,
    fullScreen,
    mapBlend,
    mapSubstance,
    setForm,
  } = props
  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )
  const blends = useStore(
    (state) => getResults(state.cp_reports.blends.data).results,
  )

  const grid = useRef<any>()
  const [initialRowData] = useState(getRowData(form.section_b))

  const [blendForm, setBlendForm] = useState<any>({
    components: [],
    composition: '',
    other_names: '',
  })
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
        data.push(mapSubstance(substance))
      }
    })
    each(blends, (blend) => {
      if (!includes(chimicalsInForm, `blend_${blend.id}`)) {
        data.push(mapBlend(blend))
      }
    })
    return data
  }, [substances, blends, form.section_b, mapSubstance, mapBlend])

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

  useEffect(() => {
    if (!createBlendModal) {
      setTimeout(() => {
        setBlendForm({ components: [], composition: '', other_names: '' })
      }, 300)
    }
  }, [createBlendModal])

  return (
    <>
      <Typography className="mb-4" component="h2" variant="h6">
        SECTION B. ANNEX F - DATA ON CONTROLLED SUBSTANCES (METRIC TONNES)
      </Typography>
      <Button
        className="mb-4"
        variant="contained"
        onClick={() => setCreateBlendModal(true)}
      >
        Create blend
      </Button>
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
        withFluidEmptyColumn
        withSeparators
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
                  setTimeout(() => {
                    const rowEl = document.querySelector(
                      `.ag-row[row-id=${newChimical.rowId}]`,
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
          <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
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
              onChange={(event: any) => {
                debounce(() => {
                  setBlendForm({
                    ...blendForm,
                    composition: event.target.value,
                  })
                })
              }}
            />
            <Field
              InputLabel={{ label: 'Blend other names' }}
              onChange={(event: any) => {
                debounce(() => {
                  setBlendForm({
                    ...blendForm,
                    other_names: event.target.value,
                  })
                })
              }}
            />
            <InputLabel className="mb-2">Blend composition</InputLabel>
            {blendForm.components.map((component: any, index: number) => (
              <div
                key={component?.substance_id || index}
                className="mb-4 grid grid-cols-[2fr_1fr_auto] items-center gap-x-4"
              >
                <Field
                  FieldProps={{ className: 'w-full mb-0' }}
                  Input={{ placeholder: 'Select substance...' }}
                  getOptionLabel={(option: any) => option.name}
                  groupBy={(option: any) => option.group}
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
                <TextWidget
                  defaultValue={component?.percentage || 0}
                  disabled={!component}
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
                    const components = [...blendForm.components]
                    components[index] = {
                      ...(components[index] || {}),
                      percentage: event.target.value || 0,
                    }
                    setBlendForm({ ...blendForm, components })
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
            ))}
            <Button
              onClick={() => {
                setBlendForm({
                  ...blendForm,
                  components: [...blendForm.components, null],
                })
              }}
            >
              + Add substance
            </Button>
            <Typography className="flex justify-end gap-x-2">
              <Button onClick={() => setCreateBlendModal(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await api('api/blends/create/', {
                    data: {
                      ...blendForm,
                      components: blendForm.components.filter(
                        (component: any) => !isNil(component),
                      ),
                    },
                    method: 'POST',
                  })
                  setCreateBlendModal(false)
                }}
              >
                Submit
              </Button>
            </Typography>
          </Box>
        </Modal>
      )}
    </>
  )
}
