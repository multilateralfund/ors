import { Metadata } from 'next'

import BPViewWrapper from "@ors/components/manage/Blocks/BusinessPlans/BP/BPView";
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails() {
  return (
    <PageWrapper>
      <BPViewWrapper />
    </PageWrapper>
  )
}
