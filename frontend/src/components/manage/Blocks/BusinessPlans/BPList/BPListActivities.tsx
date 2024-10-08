'use client'

import { useContext, useMemo, useRef, useState } from 'react'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import Activities from '@ors/components/manage/Blocks/BusinessPlans/Activities'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { formatApiUrl } from '@ors/helpers'
import { useStore } from '@ors/store'

import { multiYearFilterOptions } from '../constants'
import { filtersToQueryParams } from '../utils'

const ACTIVITIES_PER_PAGE = 20

export default function BPListActivities(props: any) {
  const { period } = props
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const firstPeriod = periodOptions?.[periodOptions.length - 1]?.value
  const lastPeriod = periodOptions?.[0]?.value
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)
  const form = useRef<any>()
  const clusters = projects.clusters.data || []

  const year_end = period?.split('-')[1] || lastPeriod.split('-')[1]
  const year_start = period?.split('-')[0] || firstPeriod.split('-')[0]

  const initialFilters = {
    is_multi_year: [multiYearFilterOptions[0]],
    limit: ACTIVITIES_PER_PAGE,
    offset: 0,
    ordering: 'business_plan__agency__name, country__name',
    year_end: year_end,
    year_start: year_start,
  }

  const getActivitiesInitialFilters = {
    ...initialFilters,
    is_multi_year: [multiYearFilterOptions[0].id],
  }

  const [filters, setFilters] = useState({ ...initialFilters })
  const { count, loaded, params, results, setParams } = useGetActivities(
    getActivitiesInitialFilters,
  )
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: ACTIVITIES_PER_PAGE,
  })
  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  const pages = Math.ceil(count / pagination.rowsPerPage)

  const exportParams = useMemo(() => filtersToQueryParams(params), [params])

  return (
    <div className="flex flex-1 flex-col justify-start gap-6 pt-6">
      <form className="flex flex-col gap-6" ref={form}>
        <ActivitiesFilters
          bpSlice={bpSlice}
          clusters={clusters}
          commonSlice={commonSlice}
          filters={filters}
          form={form}
          handleFilterChange={handleFilterChange}
          handleParamsChange={handleParamsChange}
          initialFilters={initialFilters}
          withAgency
        />
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[
            formatApiUrl(`/api/business-plan-activity/export/?${exportParams}`),
          ]}
        />
        <Activities loaded={loaded} period={period} results={results} />
      </form>

      {!!pages && pages > 1 && (
        <div className="mt-4 flex items-center justify-start">
          <Pagination
            count={pages}
            page={pagination.page}
            siblingCount={1}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
              setParams({
                limit: pagination.rowsPerPage,
                offset: ((page || 1) - 1) * pagination.rowsPerPage,
              })
            }}
          />
        </div>
      )}
    </div>
  )
}
