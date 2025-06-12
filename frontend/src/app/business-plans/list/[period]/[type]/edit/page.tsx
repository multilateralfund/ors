import { useContext, useRef } from 'react'

import BPEditConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BPEditConsolidated/BPEditConsolidated'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'
import { useStore } from '@ors/store'

export default function BusinessPlansEditConsolidated() {
  usePageTitle('Business Plans Edit')

  const activitiesRef = useRef({})
  const isFirstRender = useRef(true)

  const { businessPlan } = useStore((state) => state.businessPlan)

  const { canViewBp, canViewBpYears, canUpdateBp } =
    useContext(PermissionsContext)

  if (!canViewBp || !canViewBpYears || !canUpdateBp) {
    return <NotFoundPage />
  }
  return (
    <PageWrapper>
      <BPEditConsolidated
        key={businessPlan?.id}
        {...{ activitiesRef, isFirstRender }}
      />
    </PageWrapper>
  )
}
