import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'

export default function BusinessPlansActivities() {
  usePageTitle('Business Plans - Activities')

  const { period } = useParams<Record<string, string>>()

  return <BPListActivitiesWrapper period={period} key={period} />
}
