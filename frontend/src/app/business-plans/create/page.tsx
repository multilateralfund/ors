import { Metadata } from 'next'

import BPCreate from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/BPCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper>
      <BPCreate />
    </PageWrapper>
  )
}
