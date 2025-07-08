import { useContext, useRef } from 'react'

import BPEditConsolidated from '@ors/components/manage/Blocks/BusinessPlans/BPEditConsolidated/BPEditConsolidated'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import { useStore } from '@ors/store'

import { Redirect } from 'wouter'

export default function BusinessPlansEditConsolidated() {
  usePageTitle('Business Plans Edit')

  const activitiesRef = useRef({})
  const isFirstRender = useRef(true)

  const { businessPlan } = useStore((state) => state.businessPlan)

  const { canViewBp, canUpdateBp } = useContext(PermissionsContext)

  if (!canViewBp || !canUpdateBp) {
    return <Redirect to={'/business-plans'} />
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
