import { useContext } from 'react'

import PCRCreateWrapper from '@ors/components/manage/Blocks/PCR/create/PCRCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function PCRCreate() {
  usePageTitle('PCR create')

  const { canEditPCR } = useContext(PermissionsContext)

  if (!canEditPCR) {
    return <Redirect to="/pcr" />
  }

  return (
    <PageWrapper>
      <PCRCreateWrapper />
    </PageWrapper>
  )
}
