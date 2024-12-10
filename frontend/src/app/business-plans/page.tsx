import { useEffect } from 'react'

import { useLocation } from 'wouter'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'
import {
  getCurrentTriennium,
  getLatestBpYearRange,
} from '@ors/components/manage/Blocks/BusinessPlans/utils'

export default function BusinessPlans() {
  const [_, setLocation] = useLocation()

  const currentTriennium = getCurrentTriennium()

  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const latestBpYearRange = getLatestBpYearRange(periodOptions)

  useEffect(() => {
    if (periodOptions.length > 0) {
      setLocation(
        `/business-plans/list/activities/${latestBpYearRange?.value || currentTriennium}`,
      )
    }
  }, [periodOptions, setLocation])

  return <></>
}
