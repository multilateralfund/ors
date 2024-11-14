'use client'
import React, { useMemo } from 'react'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import TableDateSwitcher from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

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
      </div>
    </div>
  )
}
