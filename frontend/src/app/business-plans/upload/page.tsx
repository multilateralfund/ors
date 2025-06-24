import { useContext } from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import BPUpload from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function BusinessPlans() {
  usePageTitle('Business Plans Upload')

  const { canUpdateBp } = useContext(PermissionsContext)

  if (!canUpdateBp) {
    return <Redirect to={'/business-plans'} />
  }

  return (
    <PageWrapper>
      <BPUpload />
    </PageWrapper>
  )
}
