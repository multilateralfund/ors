import React from 'react'

import { Metadata } from 'next'

import BPListActivities from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPListActivities'

export const metadata: Metadata = {
  title: 'Business Plans - Activities',
}

export default async function BusinessPlansActivities(props: any) {
  const { period } = props.params
  return <BPListActivities period={period} />
}
