import { useEffect } from 'react'

import { useLocation } from 'wouter'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useGetYearRanges } from '@ors/components/manage/Blocks/BusinessPlans/useGetYearRanges'

export default function BusinessPlans() {
  const [_, setLocation] = useLocation()

  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)

  useEffect(() => {
    if (periodOptions.length > 0) {
      setLocation(`/business-plans/list/activities/${periodOptions[0].value}`)
    }
  }, [periodOptions, setLocation])

  return <></>
}
