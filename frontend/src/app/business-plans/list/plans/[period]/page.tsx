import React from 'react'

import { Metadata } from 'next'

import BPList from '@ors/components/manage/Blocks/BusinessPlans/BPList/BPList'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansList(props: any) {
  const { period } = props.params
  return <BPList period={period} />
}
