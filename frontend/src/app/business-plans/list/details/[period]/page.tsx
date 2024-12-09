import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'
import BPDetailsConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BP/BPDetailsConsolidated'
import { useContext } from 'react'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { useSetInitialBpType } from '@ors/components/manage/Blocks/BusinessPlans/useSetInitialBpType'

export default function BusinessPlansDetailsConsolidated() {
  usePageTitle('Business Plans')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { period } = useParams<Record<string, string>>()
  const bpType = useSetInitialBpType(yearRanges, period)

  return (
    yearRangesLoaded && (
      <BPDetailsConsolidated key={period} {...{ period, bpType }} />
    )
  )
}
