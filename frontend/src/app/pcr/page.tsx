import { useContext } from 'react'

import PCRListingWrapper from '@ors/components/manage/Blocks/PCR/PCRListing/PCRListingWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function PCRListing() {
  usePageTitle('PCR projects listing')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <PCRListingWrapper />
    </PageWrapper>
  )
}
