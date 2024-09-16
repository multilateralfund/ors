import { ApiSubstance } from '@ors/types/api_substances'
import { ReportVariant } from '@ors/types/variants'

import React, { useMemo, useRef, useState } from 'react'

import { Alert, Box, Button, Modal, Typography } from '@mui/material'
import { CellValueChangedEvent, RowNode } from 'ag-grid-community'
import { each, find, findIndex, includes, union } from 'lodash'

import { NewAddSubstanceDropdowns } from '@ors/components/manage/Blocks/Section/SectionA/Create/NewAddSubstanceDropdowns'
import { OldAddSubstanceDropdowns } from '@ors/components/manage/Blocks/Section/SectionA/Create/OldAddSubstanceDropdowns'
import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import SectionA from '@ors/models/SectionA'
import { useStore } from '@ors/store'

import { ISectionACreateProps, SectionARowData } from '../types'
import useGridOptions from './schema'

import { IoAddCircle, IoInformationCircleOutline } from 'react-icons/io5'

function getRowData(
  data: SectionA['data'],
  model: ReportVariant['model'],
): SectionARowData[] {
  let rowData: SectionARowData[] = []
  const dataByGroup: Record<string, any[]> = {}
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
      group === 'Annex C, Group I' && !includes(['V'], model)
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

function getInitialPinnedBottomRowData(model: string): SectionARowData[] {
  const pinnedBottomRowData: SectionARowData[] = [
    {
      display_name: 'TOTAL',
      mandatory: false,
      row_id: 'total',
      rowType: 'total',
      substance_id: Infinity,
      tooltip: true,
    },
  ]
  if (!includes(['V'], model)) {
    pinnedBottomRowData.push({
      display_name: '',
      mandatory: false,
      row_id: 'control',
      rowType: 'control',
      substance_id: Infinity,
    })
  }
  return pinnedBottomRowData
}

export default function SectionACreate(props: ISectionACreateProps) {
  const { Section, TableProps, emptyForm, form, setForm, variant } = props
  const newNode = useRef<RowNode>()
  const substances = useStore(
    (state) =>
      getResults<ApiSubstance>(state.cp_reports.substances.data).results,
  )

  const grid = useRef<any>()
  const [pinnedBottomRowData] = useState<SectionARowData[]>(
    getInitialPinnedBottomRowData(variant.model),
  )
  const [addSubstanceModal, setAddSubstanceModal] = useState(false)
  const rowData = useMemo(() => {
    return getRowData(form.section_a, variant.model).toSorted(
      (a, b) => a.group?.localeCompare(b.group || 'zzz') || 0,
    )
  }, [form.section_a, variant.model])

  const substancesInForm = useMemo(() => {
    return form.section_a.map((substance) => substance.row_id)
  }, [form.section_a])

  // Substances for old dropdown (before 2023)
  const oldSubstancesOptions = useMemo(() => {
    const data: Array<any> = []
    each(substances, (substance) => {
      if (
        includes(['Annex C, Group I'], substance.group) &&
        includes(substance.sections, 'A') &&
        !includes(substancesInForm, `substance_${substance.id}`)
      ) {
        data.push(Section?.transformApiSubstance(substance))
      }
    })
    return data
  }, [substances, substancesInForm, Section])

  // Substances for new model (2023 onwards)
  const mandatorySubstances = useMemo(() => {
    const data: Array<any> = []

    each(emptyForm.substance_rows.section_a, (substance) => {
      if (!includes(substancesInForm, `substance_${substance.substance_id}`)) {
        const transformedSubstance = Section.transformSubstance(
          substance,
          false,
        )
        data.push({
          ...transformedSubstance,
          id: transformedSubstance.display_name,
        })
      }
    })

    return data
  }, [Section, emptyForm.substance_rows.section_a, substancesInForm])

  const optionalSubstances = useMemo(() => {
    const data: Array<any> = []

    each(substances, (substance) => {
      if (
        includes(substance.sections, 'A') &&
        includes(['Annex C, Group I'], substance.group) &&
        !includes(substancesInForm, `substance_${substance.id}`) &&
        !includes(
          mandatorySubstances.map(
            (mandatorySubstance) => mandatorySubstance.substance_id,
          ),
          substance.id,
        )
      ) {
        data.push(Section?.transformApiSubstance(substance))
      }
    })

    return data
  }, [Section, mandatorySubstances, substances, substancesInForm])

  const gridOptions = useGridOptions({
    model: variant.model,
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
        setForm((form) => ({ ...form, section_a: newData }))
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

  function dropdownOnChange(_: any, newSubstance: any) {
    if (document.activeElement) {
      // @ts-ignore
      document.activeElement.focus()
    }
    const added = find(
      form.section_a,
      (substance) => substance.row_id === newSubstance.row_id,
    )
    if (!added) {
      setForm((form: any) => ({
        ...form,
        section_a: [...form.section_a, newSubstance],
      }))
    }
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
            onClick={() => setAddSubstanceModal(true)}
          >
            Add substance <IoAddCircle className="ml-1.5" size={18} />
          </Button>
        </div>
      )}
      <Table
        {...TableProps}
        columnDefs={gridOptions.columnDefs}
        gridRef={grid}
        headerDepth={3}
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={rowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const usages = getUsagesOnCellValueChange(event)
          const newData = [...form.section_a]
          const index = findIndex(
            newData,
            (row) => row.row_id == event.data.row_id,
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
      {addSubstanceModal && (
        <Modal
          aria-labelledby="add-substance-modal-title"
          open={addSubstanceModal}
          onClose={() => setAddSubstanceModal(false)}
          keepMounted
        >
          <Box className="xs:max-w-xs w-full max-w-md absolute-center sm:max-w-sm">
            {includes(['V'], variant.model) ? (
              <NewAddSubstanceDropdowns
                mandatoryOptions={mandatorySubstances}
                optionalOptions={optionalSubstances}
                onChange={dropdownOnChange}
              />
            ) : (
              <OldAddSubstanceDropdowns
                options={oldSubstancesOptions}
                onChange={dropdownOnChange}
              />
            )}
            <Typography className="text-right">
              <Button onClick={() => setAddSubstanceModal(false)}>Close</Button>
            </Typography>
          </Box>
        </Modal>
      )}
    </>
  )
}
