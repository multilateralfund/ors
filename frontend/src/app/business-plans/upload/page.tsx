import usePageTitle from '@ors/hooks/usePageTitle'

import BPUpload from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function BusinessPlans() {
  usePageTitle('Business Plans Upload')

  return (
    <PageWrapper>
      <BPUpload />
    </PageWrapper>
  )
}
