import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'

export default function BusinessPlansActivities() {
  const { period } = useParams<Record<string, string>>()
  usePageTitle('Business Plans - Activities')
  return <BPListActivitiesWrapper period={period} key={period} />
}
