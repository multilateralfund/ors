import React from 'react'

import { Metadata } from 'next'

import BPActivities from '@ors/components/manage/Blocks/BusinessPlans/BPActivities'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansActivities(props: any) {
  const { period } = props.params
  return <BPActivities period={period} />
}
