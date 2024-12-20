'use client'

import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import Activities from '@ors/components/manage/Blocks/BusinessPlans/Activities'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'
import Loading from '@ors/components/theme/Loading/Loading'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { useStore } from '@ors/store'

import BPFilters from '../../Table/BusinessPlansTable/BPFilters'
import { BPTable } from '../../Table/BusinessPlansTable/BusinessPlansTable'
import { TableDataSelectorValuesType } from '../../Table/BusinessPlansTable/TableDateSwitcher'
import { ViewSelectorValuesType } from '../types'
import BPListHeader from './BPListHeader'
import BPListTabs from './BPListTabs'
import BPTableToolbarButtons from '@ors/app/business-plans/BPTableToolbarButtons'
import { formatApiUrl } from '@ors/helpers'
import { filtersToQueryParams } from '../utils'

const ACTIVITIES_PER_PAGE_TABLE = 50
const ACTIVITIES_PER_PAGE_LIST = 20

export default function BPListActivitiesWrapper(props: any) {
  const { period, bpType } = props
  const [year_start, year_end] = period.split('-')

  const { yearRanges } = useContext(BPYearRangesContext) as any

  const initialFilters = {
    bp_status: bpType,
    limit: ACTIVITIES_PER_PAGE_TABLE,
    offset: 0,
    year_end: year_end,
    year_start: year_start,
  }

  const activities = useGetActivities(initialFilters)
  const { setParams, loading, params } = activities

  const exportParams = useMemo(() => filtersToQueryParams(params), [params])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPTableToolbarButtons
        downloadTexts={['Download']}
        downloadUrls={[
          formatApiUrl(`/api/business-plan-activity/export/?${exportParams}`),
        ]}
      />
      <BPListHeader viewType="activities" {...{ setParams }} />
      <BPListTabs />
      <BPListActivities
        {...{
          activities,
          initialFilters,
          period,
          yearRanges,
        }}
      />
    </>
  )
}

function BPListActivities(props: any) {
  const { activities, initialFilters, period, yearRanges } = props
  const { count, loaded, loading, results, setParams } = activities

  const form = useRef<any>()

  const [filters, setFilters] = useState({ ...initialFilters })
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: ACTIVITIES_PER_PAGE_LIST,
  })
  const pages = Math.ceil(count / pagination.rowsPerPage)

  const [gridOptions, setGridOptions] =
    useState<TableDataSelectorValuesType>('all')

  const [displayOptions, setDisplayOptions] =
    useState<ViewSelectorValuesType>('table')

  const displayFilters = () => (
    <BPFilters
      withAgency={true}
      {...{
        displayOptions,
        filters,
        form,
        gridOptions,
        initialFilters,
        setDisplayOptions,
        setFilters,
        setGridOptions,
        setParams,
      }}
    />
  )

  const { bpType } = useStore((state) => state.bpType)
  const key = JSON.stringify(filters) + '-' + bpType

  useEffect(() => {
    setPagination({ page: 1, rowsPerPage: ACTIVITIES_PER_PAGE_LIST })
  }, [key, displayOptions])

  return (
    yearRanges &&
    yearRanges.length > 0 && (
      <div
        className="activities flex flex-1 flex-col justify-start gap-6 rounded-b-lg rounded-r-lg border border-solid border-primary p-6"
        key={gridOptions + '-' + displayOptions}
      >
        <form className="flex flex-col gap-6" ref={form}>
          {displayOptions === 'table' ? (
            <BPTable
              key={key}
              bpPerPage={ACTIVITIES_PER_PAGE_TABLE}
              withAgency={true}
              {...{
                count,
                displayFilters,
                filters,
                gridOptions,
                loaded,
                loading,
                results,
                setParams,
                yearRanges,
              }}
            />
          ) : (
            <>
              {displayFilters()}
              <Activities
                displayAgency={true}
                {...{
                  gridOptions,
                  period,
                  results,
                }}
              />
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
            </>
          )}
        </form>
      </div>
    )
  )
}
