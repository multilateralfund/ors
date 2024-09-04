import React from 'react'

import { Metadata } from 'next'

import BPCreate from '@ors/components/manage/Blocks/BusinessPlans/BPCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper className="max-w-screen-xl xl:px-0">
      <BPCreate />
    </PageWrapper>
  )
}
