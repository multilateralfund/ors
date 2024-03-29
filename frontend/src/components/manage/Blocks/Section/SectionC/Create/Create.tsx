import {
  EmptyReportSubstance,
  EmptyReportType,
} from '@ors/types/api_empty-form'
import { ReportVariant } from '@ors/types/variants'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Alert, Box, Button, Modal, Typography } from '@mui/material'
import { RowNode } from 'ag-grid-community'
import { each, find, findIndex, includes, union } from 'lodash'

import {
  CPBaseForm,
  PassedCPCreateTableProps,
} from '@ors/components/manage/Blocks/CountryProgramme/CPCreate'
import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Footnotes from '@ors/components/theme/Footnotes/Footnotes'
import { getResults } from '@ors/helpers/Api/Api'
import { applyTransaction, scrollToElement } from '@ors/helpers/Utils/Utils'
import useApi from '@ors/hooks/useApi'
import SectionC, { DeserializedDataC } from '@ors/models/SectionC'
import { useStore } from '@ors/store'

import useGridOptions from './schema'

import { IoInformationCircleOutline } from 'react-icons/io5'

export type RowData = DeserializedDataC & {
  count?: number
  rowType?: string
  tooltip?: boolean
}

export type SubstancePrice = {
  blend_id: null | number
  current_year_price: string
  previous_year_price: string
  remarks: string
  substance_id: null | number
}
export type SubstancePrices = SubstancePrice[]

function indexKey(elem: {
  blend_id?: null | number
  substance_id?: null | number
}): string {
  return elem.blend_id
    ? `blend_id_${elem.blend_id}`
    : `substance_id_${elem.substance_id}`
}

function getRowData(
  data: SectionC['data'],
  substanceRows: EmptyReportSubstance[],
  substancePrices: SubstancePrices,
  model: string,
): RowData[] {
  let rowData: RowData[] = []
  const dataByGroup: Record<string, RowData[]> = {}
  const groups: string[] = []
  const substanceOrder = substanceRows.reduce(
    (acc: Record<string, number>, val) => {
      acc[indexKey(val)] = val.sort_order
      return acc
    },
    {},
  )
  const substancePriceMapping = substancePrices.reduce(
    (acc: Record<string, SubstancePrice>, price) => {
      if (!!price.substance_id) {
        acc[`substance_id_${price.substance_id}`] = price
      }
      if (!!price.blend_id) {
        acc[`blend_id_${price.blend_id}`] = price
      }
      return acc
    },
    {},
  )
  each(data, (item) => {
    const group = item.group || 'Other'
    if (!dataByGroup[group]) {
      dataByGroup[group] = []
    }
    if (!includes(groups, group)) {
      groups.push(group)
    }
    const itemData = { ...item, group }
    if (
      !itemData.previous_year_price &&
      (itemData.blend_id || itemData.substance_id)
    ) {
      const prevYearPrice = parseFloat(
        substancePriceMapping[indexKey(itemData)]?.current_year_price,
      )
      if (prevYearPrice) {
        itemData.previous_year_price = prevYearPrice
      }
    }
    dataByGroup[group].push(itemData)
  })
  each(groups, (group) => {
    rowData = union(
      rowData,
      [
        {
          count: dataByGroup[group].length,
          display_name: group,
          group,
          mandatory: false,
          row_id: group,
          rowType: 'group',
        },
      ],
      dataByGroup[group].sort(
        (a, b) => substanceOrder[indexKey(a)] - substanceOrder[indexKey(b)],
      ),
      ['IV'].includes(model) && group === 'Alternatives'
        ? [
            {
              display_name: 'Other alternatives (optional):',
              group,
              mandatory: false,
              row_id: 'other_alternatives',
              rowType: 'hashed',
            },
          ]
        : [],
    )
  })
  return rowData
}

export default function SectionCCreate(props: {
  Section: SectionC
  TableProps: PassedCPCreateTableProps
  emptyForm: EmptyReportType
  form: CPBaseForm
  setForm: React.Dispatch<React.SetStateAction<CPBaseForm>>
  variant: ReportVariant
}) {
  const { Section, TableProps, emptyForm, form, setForm, variant } = props
  const newNode = useRef<RowNode>()
  const substances = useStore(
    (state) => getResults(state.cp_reports.substances.data).results,
  )

  const substancePrices = useApi<SubstancePrices>({
    options: {
      triggerIf: !!form.country?.id,
    },
    path: `/api/country-programme/prices/?year=${form.year - 1}&country_id=${form.country?.id}`,
  })

  const grid = useRef<any>()
  const initialRowData = useMemo(
    () =>
      getRowData(
        form.section_c,
        emptyForm.substance_rows?.section_c || [],
        substancePrices.data || [],
        variant.model,
      ),
    [form, emptyForm, substancePrices.data],
  )
  const [pinnedBottomRowData] = useState([{ rowType: 'control' }])

  const [addChemicalModal, setAddChemicalModal] = useState(false)

  const chemicalsOptions = useMemo(() => {
    const data: Array<any> = []
    const chemicalsInForm = form.section_c.map(
      (chemical: any) => chemical.row_id,
    )
    each(substances, (substance) => {
      if (
        includes(substance.sections, 'C') &&
        !includes(chemicalsInForm, `substance_${substance.id}`)
      ) {
        data.push(
          Section.transformSubstance({
            ...substance,
            blend_id: null,
            chemical_name: substance.name,
            substance_id: substance.id,
          }),
        )
      }
    })
    return data
  }, [substances, form.section_c, Section])

  const gridOptions = useGridOptions({
    model: variant.model,
    onRemoveSubstance: (props: any) => {
      const removedSubstance = props.data
      const newData = [...form.section_c]
      const index = findIndex(
        form.section_c,
        (substance: any) => substance.row_id == removedSubstance.row_id,
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
    openAddChemicalModal: () => setAddChemicalModal(true),
  })

  useEffect(() => {
    substancePrices.setApiSettings({
      options: {
        ...substancePrices.apiSettings.options,
        triggerIf: !!form.country?.id,
      },
      path: `/api/country-programme/prices/?year=${form.year - 1}&country_id=${form.country?.id}`,
    })
    // eslint-disable-next-line
  }, [form.country])

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
        pinnedBottomRowData={pinnedBottomRowData}
        rowData={initialRowData}
        defaultColDef={{
          ...TableProps.defaultColDef,
          ...gridOptions.defaultColDef,
        }}
        onCellValueChanged={(event) => {
          const newData = [...form.section_c]
          const index = findIndex(
            newData,
            (row: any) => row.row_id == event.data.row_id,
          )
          if (index > -1) {
            // Should not be posible for index to be -1
            newData.splice(index, 1, {
              ...event.data,
            })
            setForm({ ...form, section_c: newData })
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
                  form.section_c,
                  (chemical) => chemical.row_id === newChemical.row_id,
                )
                if (!added) {
                  const groupNode = grid.current.api.getRowNode(
                    newChemical.group,
                  )
                  const createGroup = !groupNode
                  const { group } = newChemical

                  setForm((form: any) => ({
                    ...form,
                    section_c: [...form.section_c, newChemical],
                  }))
                  if (createGroup) {
                    applyTransaction(grid.current.api, {
                      add: [
                        {
                          count: 1,
                          display_name: group,
                          group,
                          row_id: group,
                          rowType: 'group',
                        },
                        newChemical,
                        {
                          display_name: 'Sub-total',
                          group,
                          row_id: `subtotal[${group}]`,
                          rowType: 'subtotal',
                        },
                      ],
                      addIndex: grid.current.api.getLastDisplayedRow() + 1,
                    })
                  } else {
                    applyTransaction(grid.current.api, {
                      add: [newChemical],
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
                    newChemical.row_id,
                  )
                  newNode.current = substanceNode
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
    </>
  )
}
