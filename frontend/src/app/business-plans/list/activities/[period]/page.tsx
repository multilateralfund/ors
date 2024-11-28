import { useEffect } from 'react'

import { useParams } from 'wouter'

import BPListActivitiesWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'

export default function BusinessPlansActivities() {
  const { period } = useParams<Record<string, string>>()
  useEffect(function () {
    document.title = 'Business Plans - Activities'
  }, [])
  return <BPListActivitiesWrapper period={period} />
}
