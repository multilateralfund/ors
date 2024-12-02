import usePageTitle from '@ors/hooks/usePageTitle'

import BPUploadWrapper from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function BusinessPlans() {
  usePageTitle('Business Plans Upload')
  return (
    <PageWrapper>
      <BPUploadWrapper />
    </PageWrapper>
  )
}
