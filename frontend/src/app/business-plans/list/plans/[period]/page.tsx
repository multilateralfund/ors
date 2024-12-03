import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPList from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPList'

export default function BusinessPlansList() {
  usePageTitle('Business Plans')
  const { period } = useParams<Record<string, string>>()

  return <BPList period={period} key={period} />
}
