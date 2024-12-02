import usePageTitle from '@ors/hooks/usePageTitle'

import BPViewWrapper from '@ors/components/manage/Blocks/BusinessPlans/BP/BPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function BusinessPlansDetails() {
  usePageTitle('Business Plans')
  return (
    <PageWrapper>
      <BPViewWrapper />
    </PageWrapper>
  )
}
