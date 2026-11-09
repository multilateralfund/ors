import { useContext } from 'react'

import PCRArchiveIndividualWrapper from '@ors/components/manage/Blocks/PCR/PCRArchiveIndividual/PCRArchiveIndividualWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect } from 'wouter'

export default function PCRArchiveIndividualPage() {
  const { canViewPCR } = useContext(PermissionsContext)

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <PCRArchiveIndividualWrapper />
    </PageWrapper>
  )
}
