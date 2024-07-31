'use client'

import { useState } from 'react'

import { BPFilters } from '@ors/components/manage/Blocks/BusinessPlans/BPList/BpFilters'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import SimpleList from '@ors/components/ui/SimpleList/SimpleList'
import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

type StatusFilterTypes =
  | 'Approved'
  | 'Draft'
  | 'Need Changes'
  | 'Rejected'
  | 'Submitted'

type FiltersType = {
  agency_id: null | number
  status: StatusFilterTypes | null
  year_end: null | number
  year_start: null | number
}

const PLANS_PER_PAGE = 20

function useBPListApi(filters?: any) {
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        ...filters,
        limit: PLANS_PER_PAGE,
        offset: 0,
        ordering: '-year_start',
      },
      withStoreCache: true,
    },
    path: 'api/business-plan/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default function BPList(props: any) {
  const { period } = props
  const bpSlice = useStore((state) => state.businessPlans)
  const { agencies, settings } = useStore((state) => state.common)

  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PLANS_PER_PAGE,
  })
  const [filters, setFilters] = useState<FiltersType>({
    agency_id: null,
    status: null,
    year_end: period.split('-')[1],
    year_start: period.split('-')[0],
  })

  const { count, results, setParams } = useBPListApi(filters)

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
    <>
      <div className="mb-6 flex items-center justify-end gap-x-6 lg:mb-4 lg:gap-x-4">
        <Link
          className="px-4 py-2 text-lg uppercase"
          color="secondary"
          href="/business-plans/create"
          variant="contained"
          button
        >
          Create new plan
        </Link>
      </div>
      <BPFilters
        agencies={agencies.data}
        filters={filters}
        handleSearch={handleSearch}
        setFilters={handleFiltersChange}
        statuses={settings.data.business_plan_statuses}
        yearRanges={bpSlice.yearRanges.data}
      />
      <div className="relative flex flex-col-reverse gap-6 lg:flex-row lg:gap-4">
        <div className="flex flex-1 flex-col justify-start gap-6">
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
    </>
  )
}
