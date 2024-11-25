import React from 'react'

import { Metadata } from 'next'

import BPEditConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BPEditConsolidated/BPEditConsolidated'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans Edit Consolidated',
}

export default async function BusinessPlansEditConsolidated() {
  return (
    <PageWrapper>
      <BPEditConsolidated />
    </PageWrapper>
  )
}
