'use client'
import React, { useMemo } from 'react'

import { capitalize } from 'lodash'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import TableDateSwitcher from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import Field from '@ors/components/manage/Form/Field'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { bpTypes } from '../../BusinessPlans/constants'
import { filtersToQueryParams } from '../../BusinessPlans/utils'
import TableViewSelector from './TableViewSelector'

export default function BPFilters({
  displayOptions,
  filters,
  form,
  gridOptions,
  initialFilters,
  reqParams,
  setDisplayOptions,
  setFilters,
  setGridOptions,
  setParams,
  withAgency = false,
}: any) {
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)
  const clusters = projects.clusters.data || []

  const { setBPType } = useStore((state) => state.bpType)

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters: any) => ({ ...filters, ...newFilters }))
  }

  const exportParams = useMemo(
    () => filtersToQueryParams(reqParams),
    [reqParams],
  )

  return (
    <div className="bp-table-toolbar mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <DownloadButtons
        downloadTexts={['Download']}
        downloadUrls={[
          formatApiUrl(`/api/business-plan-activity/export/?${exportParams}`),
        ]}
      />
      <ActivitiesFilters
        bpSlice={bpSlice}
        clusters={clusters}
        commonSlice={commonSlice}
        filters={filters}
        form={form}
        handleFilterChange={handleFilterChange}
        handleParamsChange={handleParamsChange}
        initialFilters={initialFilters}
        withAgency={withAgency}
      />
      <div className="flex gap-4 self-start">
        <TableViewSelector
          changeHandler={(_, value) => setDisplayOptions(value)}
          value={displayOptions}
        />
        <TableDateSwitcher
          changeHandler={(event, value) => setGridOptions(value)}
          value={gridOptions}
        />
        <Field
          FieldProps={{ className: 'mb-0 w-full md:w-36 BPList' }}
          options={bpTypes}
          value={capitalize(reqParams.version_type)}
          widget="autocomplete"
          isOptionEqualToValue={(option, value) =>
            option.id === value.toLowerCase()
          }
          onChange={(_: any, value: any) => {
            if (withAgency) {
              setBPType(value.id)
            }
            handleParamsChange({
              offset: 0,
              version_type: value.id,
            })
          }}
          disableClearable
        />
      </div>
    </div>
  )
}
