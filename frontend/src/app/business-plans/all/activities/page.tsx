import React from 'react'

import { Metadata } from 'next'

import BPActivities from '@ors/components/manage/Blocks/BusinessPlans/BPActivities'

export const metadata: Metadata = {
  title: 'Business Plans - Activities',
}

export default async function BusinessPlansActivities() {
  return <BPActivities />
}
