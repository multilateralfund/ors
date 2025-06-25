import { useContext } from 'react'

import BPDetailsConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BP/BPDetailsConsolidated'
import { useSetInitialBpType } from '@ors/components/manage/Blocks/BusinessPlans/useSetInitialBpType'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

import { useParams } from 'wouter'

export default function BusinessPlansDetailsConsolidated() {
  usePageTitle('Business Plans')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { period } = useParams<Record<string, string>>()
  const bpType = useSetInitialBpType(yearRanges, period)

  const { canViewBp } = useContext(PermissionsContext)

  if (!canViewBp) {
    return <NotFoundPage />
  }

  return (
    yearRangesLoaded && (
      <BPDetailsConsolidated key={period} {...{ period, bpType }} />
    )
  )
}
