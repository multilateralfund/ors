import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'
import { useContext, useEffect } from 'react'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import {
  getCurrentPeriodOption,
  getStartEndYears,
} from '@ors/components/manage/Blocks/BusinessPlans/utils'
import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import { useStore } from '@ors/store'
import { bpTypes } from '@ors/components/manage/Blocks/BusinessPlans/constants'

export default function BusinessPlansActivities() {
  usePageTitle('Business Plans - Activities')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { period } = useParams<Record<string, string>>()

  const [year_start] = getStartEndYears(periodOptions, period)
  const currentPeriod = getCurrentPeriodOption(periodOptions, year_start)

  const { setBPType } = useStore((state) => state.bpType)
  const firstBpType = bpTypes[0].label
  const secondBpType = bpTypes[1].label
  const initialBpType = currentPeriod?.status.includes(secondBpType)
    ? secondBpType
    : currentPeriod?.status.includes(firstBpType)
      ? firstBpType
      : ''

  useEffect(() => {
    setBPType(initialBpType)
  }, [initialBpType])

  return (
    yearRangesLoaded && (
      <BPListActivitiesWrapper
        period={period}
        key={period}
        bpType={initialBpType}
      />
    )
  )
}
