import { useEffect } from 'react'

import { useLocation } from 'wouter'
import { useStore } from '@ors/store'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import NotFoundPage from '@ors/app/not-found'
import {
  getCurrentTriennium,
  getLatestBpYearRange,
} from '@ors/components/manage/Blocks/BusinessPlans/utils'

export default function BusinessPlans() {
  const [_, setLocation] = useLocation()

  const currentTriennium = getCurrentTriennium()

  const { yearRanges } = useStore((state) => state.yearRanges)
  const { periodOptions } = useGetBpPeriods(yearRanges.data)
  const latestBpYearRange = getLatestBpYearRange(periodOptions)

  useEffect(() => {
    if (periodOptions.length > 0) {
      setLocation(
        `/business-plans/list/report-info/${latestBpYearRange?.value || currentTriennium}`,
      )
    }
  }, [periodOptions, setLocation])

  if (yearRanges?.error) {
    return <NotFoundPage />
  }

  return <></>
}
