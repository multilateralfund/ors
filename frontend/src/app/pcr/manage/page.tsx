import { useContext } from 'react'

import ManagePCRsWrapper from '@ors/components/manage/Blocks/PCR/ManagePCRs/ManagePCRsWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function ManagePCRs() {
  usePageTitle('Manage PCRs')

  const { canViewPCR, canMarkPCRDue } = useContext(PermissionsContext)

  if (!canViewPCR || !canMarkPCRDue) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ManagePCRsWrapper />
    </PageWrapper>
  )
}
