import usePageTitle from '@ors/hooks/usePageTitle'

import BPEditConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BPEditConsolidated/BPEditConsolidated'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { useStore } from '@ors/store'

export default function BusinessPlansEditConsolidated() {
  usePageTitle('Business Plans Edit')

  const { businessPlan } = useStore((state) => state.businessPlan)

  return (
    <PageWrapper>
      <BPEditConsolidated key={businessPlan?.id} />
    </PageWrapper>
  )
}
