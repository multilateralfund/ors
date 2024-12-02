import usePageTitle from '@ors/hooks/usePageTitle'

import BPEditConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BPEditConsolidated/BPEditConsolidated'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function BusinessPlansEditConsolidated() {
  usePageTitle('Business Plans Edit Consolidated')
  return (
    <PageWrapper>
      <BPEditConsolidated />
    </PageWrapper>
  )
}
