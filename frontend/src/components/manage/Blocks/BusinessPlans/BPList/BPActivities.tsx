'use client'

import { useRef, useState } from 'react'

import Activities from '@ors/components/manage/Blocks/BusinessPlans/Activities'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import { useGetActivities } from '@ors/components/manage/Blocks/BusinessPlans/useGetActivities'
import { useStore } from '@ors/store'

export default function BPActivities(props: any) {
  const { period } = props
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)
  const form = useRef<any>()

  const clusters = projects.clusters.data || []

  // TODO: Add filters and link them to useGetActivities
  const initialFilters = {
    // year_end: end_year,
    year_start: period?.split('-')[0],
  }

  const [filters, setFilters] = useState({ ...initialFilters })
  const { loaded, results, setParams } = useGetActivities(period)

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  return (
    <form ref={form}>
      <ActivitiesFilters
        bpSlice={bpSlice}
        clusters={clusters}
        commonSlice={commonSlice}
        filters={filters}
        form={form}
        handleFilterChange={handleFilterChange}
        handleParamsChange={handleParamsChange}
      />
      <Activities loaded={loaded} period={period} results={results} />
    </form>
  )
}
