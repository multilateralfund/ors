import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPList from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPList'
import { useContext } from 'react'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { useSetInitialBpType } from '@ors/components/manage/Blocks/BusinessPlans/useSetInitialBpType'

export default function BusinessPlansList() {
  usePageTitle('Business Plans')

  const { yearRanges, yearRangesLoaded } = useContext(
    BPYearRangesContext,
  ) as any
  const { period } = useParams<Record<string, string>>()
  const bpType = useSetInitialBpType(yearRanges, period)

  return yearRangesLoaded && <BPList key={period} {...{ period, bpType }} />
}
