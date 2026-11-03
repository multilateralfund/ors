import { useContext } from 'react'

import PCRViewWrapper from '@ors/components/manage/Blocks/PCR/PCRView/PCRViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect } from 'wouter'

export default function PCRView() {
  const { canViewPCR } = useContext(PermissionsContext)

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <PCRViewWrapper />
    </PageWrapper>
  )
}
