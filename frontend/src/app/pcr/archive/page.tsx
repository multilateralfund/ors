import { useContext } from 'react'

import PCRArchiveWrapper from '@ors/components/manage/Blocks/PCR/PCRArchive/PCRArchiveWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect } from 'wouter'

export default function PCRArchivePage() {
  const { canViewPCR } = useContext(PermissionsContext)

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <PCRArchiveWrapper />
    </PageWrapper>
  )
}
