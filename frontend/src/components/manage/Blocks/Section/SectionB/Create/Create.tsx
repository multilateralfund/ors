import { ApiBlend, ApiCreatedBlend } from '@ors/types/api_blends'
import { ApiSubstance } from '@ors/types/api_substances'
import { ReportVariant } from '@ors/types/variants'

import { useMemo, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { CellValueChangedEvent, IRowNode } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { each, find, findIndex, includes, sortBy, union, uniqBy } from 'lodash'
import { useSnackbar } from 'notistack'

import Table from '@ors/components/manage/Form/Table'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import SectionB from '@ors/models/SectionB'
import { useStore } from '@ors/store'

import { PinnedBottomRowData } from '../../types'
import { SectionBCreateProps, SectionBRowData } from '../types'
import { CreateBlend } from './CreateBlend'
import useGridOptions from './schema'

import { IoAddCircle, IoInformationCircleOutline } from 'react-icons/io5'

function getGroupName(substance: any, model: string) {
  if (substance.group.startsWith('Blends')) {
    return includes(['IV', 'V'], model)
      ? 'Blends'
      : 'Blends (Mixture of Controlled Substances)'
  }
  return substance.group || 'Other'
}

function getRowData(
  data: SectionB['data'],
  variant: ReportVariant,
): SectionBRowData[] {
  let rowData: SectionBRowData[] = []
  const dataByGroup: Record<string, any[]> = {}
  const groups: string[] = []
  each(data, (item) => {
    const group = getGroupName(item, variant.model)
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
      group.startsWith('Annex F') && includes(variant?.model, 'IV')
        ? [
            {
              display_name: 'Controlled substances',
              group,
              row_id: 'group-controlled_substances',
              rowType: 'group',
            },
          ]
        : [],
      dataByGroup[group],
      group.startsWith('Blends') && !includes(['V'], variant?.model)
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

function getInitialPinnedBottomRowData(model: string): PinnedBottomRowData[] {
  let pinnedBottomRowData: PinnedBottomRowData[] = [
    {
      display_name: 'TOTAL',
      row_id: 'bottom_total',
      rowType: 'total',
      tooltip: true,
    },
  ]
  if (!includes(['V'], model)) {
    pinnedBottomRowData = pinnedBottomRowData.concat([
      {
        display_name: '',
        row_id: 'control-add_chemical',
        rowType: 'control',
        tooltip: false,
      },
    ])
  }

  return pinnedBottomRowData
}

export default function SectionBCreate(props: SectionBCreateProps) {
  const { enqueueSnackbar } = useSnackbar()
  const { Section, TableProps, emptyForm, form, setForm, variant } = props

  const newNode = useRef<IRowNode>()

  const substances = useStore((state) =>
    getResults<ApiSubstance>(state.cp_reports.substances.data).results.filter(
      (substance) =>
        !['annex a', 'annex b', 'annex e'].some((annex) =>
          substance.group.toLowerCase().includes(annex),
        ),
    ),
  )

  const blends = useStore(
    (state) => getResults<ApiBlend>(state.cp_reports.blends.data).results,
  )

  const grid = useRef<AgGridReact>()
  const rowData = [...getRowData(form.section_b, variant)].sort(
    (a, b) => a.group?.localeCompare(b.group || 'zzz') || 0,
  )
  const pinnedRowData = getInitialPinnedBottomRowData(variant.model)

  const [addChemicalModal, setAddChemicalModal] = useState(false)
  const [modalTab, setModalTab] = useState<'existing_blends' | 'new_blend'>(
    'existing_blends',
  )

  const chemicalsInForm = useMemo(() => {
    return form.section_b.map((chemical: any) => chemical.row_id)
  }, [form.section_b])

  // Options for formats <2023 (section B is only in >=2019 formats)
  const oldChemicalOptions = useMemo(() => {
    const data: Array<any> = []
    each(substances, (substance) => {
      if (
        includes(substance.sections, 'B') &&
        !includes(['Annex F'], substance.group) &&
        !includes(chemicalsInForm, `substance_${substance.id}`)
      ) {
        data.push(Section.transformApiSubstance(substance))
      }
    })
    each(sortBy(uniqBy([...blends], 'id'), 'sort_order'), (blend) => {
      if (!includes(chemicalsInForm, `blend_${blend.id}`)) {
        data.push(Section.transformApiBlend(blend))
      }
    })
    return data
  }, [substances, blends, chemicalsInForm, Section])

  // Options for formats >=2023
  const mandatoryChemicals = useMemo(() => {
    const data: Array<any> = []

    each(
      emptyForm.substance_rows.section_b.filter((row) => row.substance_id),
      (substance) => {
        if (!includes(chemicalsInForm, `substance_${substance.substance_id}`)) {
          const transformedSubstance = Section.transformSubstance(
            substance,
            false,
          )
          data.push({
            ...transformedSubstance,
            id: transformedSubstance.display_name,
          })
        }
      },
    )

    each(
      emptyForm.substance_rows.section_b.filter((row) => row.blend_id),
      (blend) => {
        if (!includes(chemicalsInForm, `blend_${blend.blend_id}`)) {
          const transformedBlend = Section.transformBlend(blend, false)
          data.push({ ...transformedBlend, id: transformedBlend.display_name })
        }
      },
    )

    return data
  }, [Section, chemicalsInForm, emptyForm.substance_rows.section_b])

  const optionalBlends = useMemo(() => {
    const data: Array<any> = []
    const emptyFormBlendIds = emptyForm.substance_rows.section_b
      .filter((row) => row.blend_id)
      .map((blend) => blend.blend_id)

    each(sortBy(uniqBy([...blends], 'id'), 'sort_order'), (blend) => {
      if (
        !includes(emptyFormBlendIds, blend.id) &&
        !includes(chemicalsInForm, `blend_${blend.id}`)
      ) {
        data.push(Section.transformApiBlend(blend))
      }
    })

    return data
  }, [Section, blends, chemicalsInForm, emptyForm.substance_rows.section_b])

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
        const gridApi = grid.current?.api
        const groupNode = gridApi?.getRowNode(removedSubstance.group)
        if (gridApi && groupNode) {
          newData.splice(index, 1)
          setForm((form: any) => ({ ...form, section_b: newData }))
          applyTransaction(gridApi, {
            remove: [props.data],
            update: [{ ...groupNode.data, count: groupNode.data.count - 1 }],
          })
        }
      }
    },
    openAddChemicalModal: () => setAddChemicalModal(true),
    usages: emptyForm.usage_columns?.section_b || [],
  })

  function getUsagesOnCellValueChange(event: CellValueChangedEvent<any>) {
    const usages = event.data.record_usages
    if (event.source === 'cellClear' && event.colDef.category === 'usage') {
      const usageIndex = findIndex(
        usages,
        (item: any) => item.usage_id === event.colDef.id,
      )
      const gridApi = grid.current?.api
      if (gridApi) {
        if (usageIndex > -1) {
          usages[usageIndex].quantity = null
          applyTransaction(gridApi, {
            update: [{ ...event.data, record_usages: usages }],
          })
        }
      }
    }
    return usages
  }

  const onAddChemical = (_: any, newChemical: any) => {
    if (document.activeElement) {
      // @ts-ignore
      document.activeElement.focus()
    }
    const added = find(
      form.section_b,
      (chemical) => chemical.row_id === newChemical.row_id,
    )
    if (!added) {
      setForm((form: any) => ({
        ...form,
        section_b: [...form.section_b, newChemical],
      }))
    }
  }

  const onCreateBlend = (blend: ApiCreatedBlend) => {
    const serializedBlend = Section.transformApiBlend(blend)

    const added = find(
      form.section_b,
      (chemical) => chemical.row_id === serializedBlend.row_id,
    )

    if (added) {
      const gridApi = grid.current?.api
      const blendNode = gridApi?.getRowNode(serializedBlend.row_id)
      if (blendNode) {
        enqueueSnackbar(
          `Blend ${serializedBlend.name} already exists in the form.`,
          { variant: 'info' },
        )
        scrollToElement({
          callback: () => {
            grid.current?.api.flashCells({
              rowNodes: [blendNode],
            })
          },
          selectors: `.ag-row[row-id=${serializedBlend.row_id}]`,
        })
      }
    } else {
      setForm((form: any) => ({
        ...form,
        section_b: [...form.section_b, serializedBlend],
      }))
      enqueueSnackbar(
        <>
          Blend <span className="font-medium">{serializedBlend.name}</span>{' '}
          created succesfuly.
        </>,
        { variant: 'info' },
      )
    }
  }

  const closeModal = () => {
    setAddChemicalModal(false)
  }

  return (
    <>
      <Alert
        className="bg-mlfs-bannerColor"
        icon={<IoInformationCircleOutline size={24} />}
        severity="info"
      >
        <Footnotes />
      </Alert>
      {includes(['V'], variant.model) && (
        <div className="sticky top-0 z-50 flex justify-end">
          <Button
            className="rounded-lg border-[1.5px] border-solid border-primary bg-white px-3 py-2.5 text-base hover:bg-primary"
            onClick={() => setAddChemicalModal(true)}
          >
            Add substance/blend <IoAddCircle className="ml-1.5" size={18} />
          </Button>
        </div>
      )}
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        pinnedBottomRowData={pinnedRowData}
        rowData={rowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
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
            const rowNode = newNode.current
            scrollToElement({
              callback: () => {
                grid.current?.api.flashCells({
                  rowNodes: [rowNode],
                })
                newNode.current = undefined
              },
              selectors: `.ag-row[row-id=${newNode.current.data.row_id}]`,
            })
          }
        }}
      />
      {addChemicalModal && (
        <Dialog
          aria-labelledby="add-chemical-modal-title"
          open={addChemicalModal}
          onClose={closeModal}
        >
          <Box className="w-full max-w-md sm:max-w-2xl">
            <Typography
              id="add-chemical-modal-title"
              className="mb-2"
              component="h2"
              variant="h4"
            >
              {includes(['V'], variant.model) && modalTab === 'existing_blends'
                ? 'Add substance/blend'
                : 'Add blend'}
            </Typography>
            <Divider className="mb-2" />
            <ToggleButtonGroup
              className="my-4"
              color="primary"
              value={modalTab}
              onChange={(_, value) => setModalTab(value)}
              exclusive
            >
              <ToggleButton
                className="rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
                value="existing_blends"
                classes={{
                  selected: 'bg-primary text-mlfs-hlYellow',
                  standard: 'bg-white text-primary',
                }}
              >
                {includes(['V'], variant.model)
                  ? 'Existing substance/blend'
                  : 'Existing blend'}
              </ToggleButton>
              <ToggleButton
                className="rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
                value="new_blend"
                classes={{
                  selected: 'bg-primary text-mlfs-hlYellow',
                  standard: 'bg-white text-primary',
                }}
              >
                New blend
              </ToggleButton>
            </ToggleButtonGroup>
            {includes(['V'], variant.model) ? (
              modalTab === 'existing_blends' && (
                <>
                  <Typography>
                    Mandatory / usual substances and blends
                  </Typography>
                  <Autocomplete
                    id="mandatory-chemicals"
                    className="widget"
                    getOptionLabel={(option: any) => option.display_name}
                    groupBy={(option: any) => option.group}
                    options={mandatoryChemicals}
                    renderInput={(params) => (
                      <TextWidget
                        {...params}
                        autoComplete="false"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    onChange={onAddChemical}
                    disableClearable
                    disableCloseOnSelect
                  />
                  <Typography>
                    Other blends (Mixture of controlled substances)
                  </Typography>
                  <Autocomplete
                    id="other-blends"
                    className="widget"
                    getOptionLabel={(option: any) => option.display_name}
                    groupBy={(option: any) => option.group}
                    options={optionalBlends}
                    renderInput={(params) => (
                      <TextWidget
                        {...params}
                        autoComplete="false"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    onChange={onAddChemical}
                    disableClearable
                    disableCloseOnSelect
                  />
                </>
              )
            ) : (
              <Autocomplete
                id="all-substances"
                className="widget"
                getOptionLabel={(option: any) => option.display_name}
                groupBy={(option: any) => option.group}
                options={oldChemicalOptions}
                renderInput={(params) => (
                  <TextWidget
                    {...params}
                    autoComplete="false"
                    size="small"
                    variant="outlined"
                  />
                )}
                onChange={onAddChemical}
                disableClearable
                disableCloseOnSelect
              />
            )}
            {modalTab === 'new_blend' && (
              <CreateBlend
                closeModal={closeModal}
                substances={substances}
                onCreateBlend={onCreateBlend}
              />
            )}
            {modalTab === 'existing_blends' && (
              <>
                <Divider className="my-4" />
                <Button
                  className="rounded-lg border-[1.5px] border-solid border-transparent bg-[#f2f2f2] p-2.5 text-base text-[#4d4d4d] hover:border-primary"
                  onClick={closeModal}
                >
                  Close
                </Button>
              </>
            )}
          </Box>
        </Dialog>
      )}
    </>
  )
}
