import { useMemo, useRef, useState } from 'react'

import { Box, Button, Modal, Typography } from '@mui/material'
import {
  filter,
  findIndex,
  groupBy,
  includes,
  sortBy,
  union,
  uniq,
} from 'lodash'
import dynamic from 'next/dynamic'

import Field from '@ors/components/manage/Form/Field'
import { getResults } from '@ors/helpers/Api/Api'
import useStore from '@ors/store'

import useGridOptions from './schema'

const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
  ssr: false,
})

export default function SectionA() {
  const grid = useRef<any>()
  const [data, setData] = useState<Array<Record<string, any>>>([])
  const [addModal, setAddModal] = useState(false)
  const substances = useStore(
    (state) => getResults(state.reports.substances.data).results,
  )
  const filteredSubstances = useMemo(() => {
    const ids = data.map((row) => row.substance_id)
    return filter(substances, (substance) => !includes(ids, substance.id))
  }, [data, substances])

  const gridOptions = useGridOptions({ setAddModal })

  const groups = uniq(data.map((row) => row.annex_group || 'Other'))
  const resultsByGroup = groupBy(
    data.map((row) => ({
      ...row,
      annex_group: row.annex_group || 'Other',
      group: row.annex_group || 'Other',
    })),
    'group',
  )

  const rowData = useMemo(() => {
    let data: Array<any> = []
    groups.forEach((group) => {
      data = union(
        data,
        [{ chemical_name: group, group, isGroup: true }],
        resultsByGroup[group],
        [{ chemical_name: 'Sub-total', group, isSubTotal: true }],
      )
    })
    if (data.length > 0) {
      data.push({ chemical_name: 'TOTAL', isTotal: true })
    }
    return data
  }, [groups, resultsByGroup])

  return (
    <>
      <Table
        className="three-groups mb-4"
        animateRows={true}
        columnDefs={gridOptions.columnDefs}
        defaultColDef={gridOptions.defaultColDef}
        enableCellChangeFlash={true}
        enablePagination={false}
        gridRef={grid}
        rowData={[...rowData, { isController: true }]}
        rowSelection="multiple"
        suppressCellFocus={false}
        suppressRowHoverHighlight={false}
        rowClassRules={{
          'ag-row-controller': (props) => props.data.isController,
          'ag-row-group': (props) => props.data.isGroup,
          'ag-row-sub-total': (props) => props.data.isSubTotal,
          'ag-row-total': (props) => props.data.isTotal,
        }}
        onCellValueChanged={(event) => {
          setData((data) => {
            const index = findIndex(
              data,
              (row) => row.substance_id == event.data.substance_id,
            )
            const newData = [...data]
            newData.splice(index, 1, event.data)
            return newData
          })
        }}
        withSeparators
      />
      <Typography className="italic" variant="body2">
        1. Edit by pressing double left-click or ENTER on a field.
      </Typography>
      <Typography className="italic" variant="body2">
        2. Where the data involves a blend of two or more substances, the
        quantities of individual components of controlled substances must be
        indicated separately.
      </Typography>
      <Typography className="italic" variant="body2">
        3. Indicate relevant controlled substances.
      </Typography>
      <Typography className="italic" variant="body2">
        4. Provide explanation if total sector use and consumption
        (import-export+production) is different (e.g, stockpiling).
      </Typography>
      <Modal
        aria-labelledby="add-substance-modal-title"
        open={addModal}
        onClose={() => setAddModal(false)}
        keepMounted
      >
        <Box className="xs:max-w-xs absolute-center w-full max-w-md sm:max-w-sm">
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
            getOptionLabel={(option: any) => option.name}
            options={filteredSubstances}
            value={null}
            widget="autocomplete"
            onChange={(event: any, substance: any) => {
              const newSubstance = {
                annex_group: substance.group_name,
                blend_id: null,
                chemical_name: substance.formula || substance.name,
                display_name: substance.name,
                record_usages: [],
                sort_order: substance.sort_order,
                substance_data: substance,
                substance_id: substance.id,
              }
              if (document.activeElement) {
                // @ts-ignore
                document.activeElement.blur()
              }
              setData((data) => {
                const newData = sortBy([...data, newSubstance], 'sort_order')
                return newData
              })
              setAddModal(false)
            }}
          />
          <Typography className="text-right">
            <Button onClick={() => setAddModal(false)}>Close</Button>
          </Typography>
        </Box>
      </Modal>
    </>
  )
}
