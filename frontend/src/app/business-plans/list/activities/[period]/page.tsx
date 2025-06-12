import { useContext } from 'react'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'
import { useSetInitialBpType } from '@ors/components/manage/Blocks/BusinessPlans/useSetInitialBpType'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

import { useParams } from 'wouter'

export default function BusinessPlansActivities() {
  usePageTitle('Business Plans - Activities')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { period } = useParams<Record<string, string>>()
  const bpType = useSetInitialBpType(yearRanges, period)

  const { canViewActivities, canViewBpYears } = useContext(PermissionsContext)

  if (!canViewActivities || !canViewBpYears) {
    return <NotFoundPage />
  }

  return (
    yearRangesLoaded && (
      <BPListActivitiesWrapper key={period} {...{ period, bpType }} />
    )
  )
}
