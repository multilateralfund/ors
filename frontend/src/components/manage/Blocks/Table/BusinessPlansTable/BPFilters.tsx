'use client'
import { useMemo } from 'react'

import { capitalize } from 'lodash'
import { useParams } from 'wouter'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import TableDateSwitcher from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { BpPathParams } from '../../BusinessPlans/types'
import { filtersToQueryParams } from '../../BusinessPlans/utils'
import TableViewSelector from './TableViewSelector'

const ACTIVITIES_PER_PAGE_TABLE = 100
const ACTIVITIES_PER_PAGE_LIST = 20

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
  const { status } = useParams<BpPathParams>()

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

  const exportParams = useMemo(() => {
    const currentReqParams = status
      ? { ...reqParams, bp_status: capitalize(status) }
      : reqParams

    return filtersToQueryParams(currentReqParams)
  }, [status, reqParams])

  return (
    <div className="bp-table-toolbar mb-4 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
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
        <TableDateSwitcher
          changeHandler={(event, value) => setGridOptions(value)}
          value={gridOptions}
        />
        <TableViewSelector
          value={displayOptions}
          changeHandler={(_, value) => {
            setParams({
              limit:
                value === 'list'
                  ? ACTIVITIES_PER_PAGE_LIST
                  : ACTIVITIES_PER_PAGE_TABLE,
              offset: 0,
            })
            setDisplayOptions(value)
          }}
        />
      </div>
    </div>
  )
}
