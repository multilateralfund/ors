'use client'

import { useState } from 'react'

import { BPListFilters } from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListFilters'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import SimpleList from '@ors/components/ui/SimpleList/SimpleList'
import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import BPListHeader from './BPListHeader'
import BPListTabs from './BPListTabs'

type StatusFilterTypes = 'Consolidated' | 'Endorsed'

type FiltersType = {
  agency_id: null | number
  status: StatusFilterTypes | null
  year_end: null | number
  year_start: null | number
}

const PLANS_PER_PAGE = 20

export function useBPListApi(filters?: any) {
  const { data, loading, setParams, params } = useApi({
    options: {
      params: {
        ...filters,
        limit: PLANS_PER_PAGE,
        offset: 0,
        ordering: '-updated_at',
      },
      withStoreCache: false,
    },
    path: 'api/business-plan/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams, params }
}

export default function BPList(props: any) {
  const { period } = props
  const { agencies, settings } = useStore((state) => state.common)

  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PLANS_PER_PAGE,
  })
  const [filters, setFilters] = useState<FiltersType>({
    agency_id: null,
    status: null,
    year_end: period?.split('-')[1] || null,
    year_start: period?.split('-')[0] || null,
  })

  const { count, results, setParams, params } = useBPListApi(filters)

  const pages = Math.ceil(count / pagination.rowsPerPage)

  const handleFiltersChange = (newFilters: FiltersType) => {
    const newFilterState = { ...filters, ...newFilters }
    setFilters(newFilterState)
    setParams({ ...newFilters, limit: pagination.rowsPerPage, offset: 0 })
    setPagination({ page: 1, rowsPerPage: pagination.rowsPerPage })
  }

  const handleSearch = (search: string, filters: FiltersType) => {
    setParams({ ...filters, limit: pagination.rowsPerPage, offset: 0, search })
    setPagination({ page: 1, rowsPerPage: pagination.rowsPerPage })
  }

  return (
    <div className="m-auto max-w-screen-xl">
      <BPListHeader viewType="plans" {...{ params, setParams, setFilters }} />
      <BPListTabs />
      <div className="flex flex-1 flex-col justify-start gap-6 border-0 border-t border-solid border-primary pt-6">
        <BPListFilters
          agencies={agencies.data}
          filters={filters}
          handleSearch={handleSearch}
          setFilters={handleFiltersChange}
          statuses={settings.data.business_plan_statuses}
        />
        <SimpleList list={results} />
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
    </div>
  )
}
