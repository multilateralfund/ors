import type { Metadata } from 'next'

import BPDiffViewWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPDiff/BPViewDiff'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plan Diff',
}

export default async function BusinessPlansDiff() {
  return (
    <PageWrapper>
      <BPDiffViewWrapper />
    </PageWrapper>
  )
}
