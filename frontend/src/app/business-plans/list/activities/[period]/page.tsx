import React from 'react'

import { useParams } from 'wouter'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'

// export const metadata: Metadata = {
//   title: 'Business Plans - Activities',
// }

export default function BusinessPlansActivities() {
  const { period } = useParams<Record<string, string>>()
  return <BPListActivitiesWrapper period={period} />
}
