'use client'

import { useContext, useRef, useState } from 'react'

import Activities from '@ors/components/manage/Blocks/BusinessPlans/Activities'
import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'
import Loading from '@ors/components/theme/Loading/Loading'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'

import BPFilters from '../../Table/BusinessPlansTable/BPFilters'
import { BPTable } from '../../Table/BusinessPlansTable/BusinessPlansTable'
import { TableDataSelectorValuesType } from '../../Table/BusinessPlansTable/TableDateSwitcher'
import { ViewSelectorValuesType } from '../types'
import BPListHeader from './BPListHeader'
import BPListTabs from './BPListTabs'

const ACTIVITIES_PER_PAGE = 20

export default function BPListActivitiesWrapper(props: any) {
  const { period } = props
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const firstPeriod = periodOptions?.[periodOptions.length - 1]?.value
  const lastPeriod = periodOptions?.[0]?.value

  const year_end = period?.split('-')[1] || lastPeriod.split('-')[1]
  const year_start = period?.split('-')[0] || firstPeriod.split('-')[0]

  const initialFilters = {
    limit: ACTIVITIES_PER_PAGE,
    offset: 0,
    year_end: year_end,
    year_start: year_start,
  }
  const activities = useGetActivities(initialFilters)
  const { loading } = activities

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPListHeader viewType="activities" />
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
  const {
    count,
    loaded,
    loading,
    params: reqParams,
    results,
    setParams,
  } = activities

  const form = useRef<any>()

  const [filters, setFilters] = useState({ ...initialFilters })
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: ACTIVITIES_PER_PAGE,
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
        reqParams,
        setDisplayOptions,
        setFilters,
        setGridOptions,
        setParams,
      }}
    />
  )

  return (
    yearRanges &&
    yearRanges.length > 0 && (
      <div className="activities flex flex-1 flex-col justify-start gap-6 rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <form className="flex flex-col gap-6" ref={form}>
          {displayOptions === 'table' ? (
            <BPTable
              withAgency={true}
              {...{
                count,
                displayFilters,
                displayOptions,
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
                  loaded,
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
