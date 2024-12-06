import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'
import BPDetailsConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BP/BPDetailsConsolidated'

export default function BusinessPlansDetailsConsolidated() {
  usePageTitle('Business Plans')

  const { period } = useParams<Record<string, string>>()

  return <BPDetailsConsolidated key={period} />
}
