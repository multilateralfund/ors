'use client'

import useGetBpPeriods from './BPList/useGetBPPeriods'
import { RedirectToBpList } from './RedirectToBpList'
import { useGetYearRanges } from './useGetYearRanges'

export default function BPCreate() {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)

  return (
    <div className="flex flex-col gap-2">
      <RedirectToBpList currentYearRange={periodOptions?.[0]?.value} />
      <div>Create a business plan</div>
    </div>
  )
}
