'use client'

import { useStore } from '@ors/store'

import useGetBpPeriods from './BPList/useGetBPPeriods'
import { RedirectToBpList } from './RedirectToBpList'
import { useGetYearRanges } from './useGetYearRanges'

export default function BPCreate() {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { bpFilters } = useStore((state) => state.bpFilters)

  const currentYearRange = bpFilters.range
    ? bpFilters.range
    : periodOptions?.[0]?.value

  return (
    <div className="flex flex-col gap-2">
      <RedirectToBpList {...{ currentYearRange }} />
      <div>Create a business plan</div>
    </div>
  )
}
