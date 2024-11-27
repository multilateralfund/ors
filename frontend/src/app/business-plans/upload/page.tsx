import { Metadata } from 'next'

import BPUploadWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans Upload',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper>
      <BPUploadWrapper />
    </PageWrapper>
  )
}
