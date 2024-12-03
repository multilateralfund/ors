import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'
import BPDetailsFull from '@ors/components/manage/Blocks/BusinessPlans/BP/BPDetailsFull'

export default function BusinessPlansListDetails() {
  usePageTitle('Business Plans')
  const { period } = useParams<Record<string, string>>()

  return <BPDetailsFull period={period} key={period} />
}
