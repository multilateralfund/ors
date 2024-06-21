import { Metadata } from 'next'

import BPView from '@ors/components/manage/Blocks/BusinessPlans/BPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails() {
  return (
    <PageWrapper>
      <BPView />
    </PageWrapper>
  )
}
