'use client'

import { useState } from 'react'

import { Box } from '@mui/material'

import Field from '@ors/components/manage/Form/Field'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import SimpleList from '@ors/components/ui/SimpleList/SimpleList'
import { debounce, getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { IoChevronDownCircle } from 'react-icons/io5'

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

const StatusFilter = (props: {
  filters: any
  setFilters: any
  statuses: any
}) => {
  const { filters, setFilters, statuses } = props

  // Map statuses to an array of objects with label and value
  const statusOptions = statuses.map((status: any) => ({
    label: status[1],
    value: status[0],
  }))

  return (
    <Field
      FieldProps={{ className: 'mb-0 w-full CPListing' }}
      options={statusOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'STATUS',
      }}
      getOptionLabel={(option: { label: string; value: string }) =>
        option.label
      }
      value={
        statusOptions.find((option: any) => option.value === filters.status) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, status: value ? value.value : null })
        })
      }}
    />
  )
}

const YearSelect = (props: {
  filters: any
  setFilters: any
  yearRanges: any
}) => {
  const { filters, setFilters, yearRanges } = props

  // Extract start and end years as separate lists
  const startYearOptions = yearRanges.map((range: any) => range.year_start)
  const endYearOptions = yearRanges.map((range: any) => range.year_end)

  return (
    <div className="flex gap-4">
      <Field
        FieldProps={{ className: 'mb-0 w-full CPListing' }}
        getOptionLabel={(option: number) => option.toString()}
        options={startYearOptions}
        popupIcon={<IoChevronDownCircle color="black" size={24} />}
        value={filters.year_start}
        widget="autocomplete"
        Input={{
          placeholder: 'Start Year',
        }}
        onChange={(_: any, value: any) => {
          debounce(() => {
            setFilters({ ...filters, year_start: value || null })
          })
        }}
      />
      <Field
        FieldProps={{ className: 'mb-0 w-full CPListing' }}
        getOptionLabel={(option: number) => option.toString()}
        options={endYearOptions}
        popupIcon={<IoChevronDownCircle color="black" size={24} />}
        value={filters.year_end}
        widget="autocomplete"
        Input={{
          placeholder: 'End Year',
        }}
        onChange={(_: any, value: any) => {
          debounce(() => {
            setFilters({ ...filters, year_end: value || null })
          })
        }}
      />
    </div>
  )
}

const AgencyFilter = (props: {
  agencies: any
  filters: any
  setFilters: any
}) => {
  const { agencies, filters, setFilters } = props

  const agencyOptions = agencies.map((agency: any) => ({
    id: agency.id,
    label: agency.name,
  }))

  return (
    <Field
      FieldProps={{ className: 'mb-0 w-full CPListing' }}
      getOptionLabel={(option: { id: number; label: string }) => option.label}
      options={agencyOptions}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      widget="autocomplete"
      Input={{
        placeholder: 'AGENCY',
      }}
      value={
        agencyOptions.find((option: any) => option.id === filters.agency_id) ||
        null
      }
      onChange={(_: any, value: any) => {
        debounce(() => {
          setFilters({ ...filters, agency_id: value ? value.id : null })
        })
      }}
    />
  )
}

function BPFilters(props: any) {
  const { agencies, filters, setFilters, statuses, yearRanges } = props

  return (
    <Box
      id="filters"
      className="sticky top-2 flex h-fit flex-col gap-6 rounded-lg p-8 md:min-w-96"
    >
      <StatusFilter
        filters={filters}
        setFilters={setFilters}
        statuses={statuses}
      />
      <AgencyFilter
        agencies={agencies}
        filters={filters}
        setFilters={setFilters}
      />
      <YearSelect
        filters={filters}
        setFilters={setFilters}
        yearRanges={yearRanges}
      />
    </Box>
  )
}

export default function BPList() {
  const bpSlice = useStore((state) => state.businessPlans)
  const { agencies, settings } = useStore((state) => state.common)

  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PLANS_PER_PAGE,
  })
  const [filters, setFilters] = useState<FiltersType>({
    agency_id: null,
    status: null,
    year_end: null,
    year_start: null,
  })

  const { count, results, setParams } = useBPListApi(filters)

  const pages = Math.ceil(count / pagination.rowsPerPage)

  const handleFiltersChange = (newFilters: FiltersType) => {
    const newFilterState = { ...filters, ...newFilters }
    setFilters(newFilterState)
    setParams({ ...newFilters, limit: pagination.rowsPerPage, offset: 0 })
    setPagination({ page: 1, rowsPerPage: pagination.rowsPerPage })
  }

  return (
    <>
      <div className="container mb-6 flex items-center justify-end gap-x-6 lg:mb-4 lg:gap-x-4">
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
      <div className="container relative flex flex-col-reverse gap-6 lg:flex-row lg:gap-4 xl:px-0">
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
        <BPFilters
          agencies={agencies.data}
          filters={filters}
          setFilters={handleFiltersChange}
          statuses={settings.data.business_plan_statuses}
          yearRanges={bpSlice.yearRanges.data}
        />
      </div>
    </>
  )
}
