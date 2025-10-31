import {
  GlobalRequestParams,
  RowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import React, { useCallback, useState } from 'react'
import { initialRequestParams } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/initialData.ts'
import useBlanketApprovalDetailsFilters from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/useBlanketApprovalDetailsFilters.ts'
import { FilterField } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/FilterField.tsx'
import { Button, Divider } from '@mui/material'

type AddEntryForm = {
  rows: RowData[]
  addRow: (rowParams: RowData['params']) => void
  globalRequestParams: GlobalRequestParams
}
export const AddEntryForm = (props: AddEntryForm) => {
  const { globalRequestParams, addRow } = props
  const [form, setForm] = useState(initialRequestParams())

  const { filters } = useBlanketApprovalDetailsFilters(globalRequestParams)

  const handleChange = useCallback(
    (name: keyof typeof form) => {
      return (value: string) => {
        setForm((prevState) => ({ ...prevState, [name]: value }))
      }
    },
    [setForm],
  )

  const handleAddRow = useCallback(() => {
    addRow({ ...form })
    setForm(initialRequestParams())
  }, [addRow, form])

  return (
    <div className="flex w-full items-center justify-between py-4">
      <div className="mr-8 flex gap-x-8">
        <FilterField
          label="Country"
          options={filters?.country ?? []}
          value={form.country_id}
          onChange={handleChange('country_id')}
        />
        <Divider orientation="vertical" flexItem />
        <FilterField
          label="Cluster"
          options={filters?.cluster ?? []}
          value={form.cluster_id}
          onChange={handleChange('cluster_id')}
        />
        <Divider orientation="vertical" flexItem />
        <FilterField
          label="Type"
          options={filters?.project_type ?? []}
          value={form.project_type_id}
          onChange={handleChange('project_type_id')}
        />
      </div>
      <Button size="large" variant="contained" onClick={handleAddRow}>
        Add entry
      </Button>
    </div>
  )
}
