import type { Metadata } from 'next'

import BPDiffView from '@ors/components/manage/Blocks/BusinessPlans/BPDiff/BPDiffView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plan Diff',
}

export default async function BusinessPlansDiff() {
  return (
    <PageWrapper>
      <BPDiffView />
    </PageWrapper>
  )
}
