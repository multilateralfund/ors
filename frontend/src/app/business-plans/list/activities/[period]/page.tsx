import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'
import { useContext } from 'react'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { useSetInitialBpType } from '@ors/components/manage/Blocks/BusinessPlans/useSetInitialBpType'

export default function BusinessPlansActivities() {
  usePageTitle('Business Plans - Activities')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { period } = useParams<Record<string, string>>()
  const bpType = useSetInitialBpType(yearRanges, period)

  return (
    yearRangesLoaded && (
      <BPListActivitiesWrapper key={period} {...{ period, bpType }} />
    )
  )
}
