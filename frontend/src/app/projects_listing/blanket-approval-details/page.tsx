import { useContext } from 'react'
import {
  PageTitle,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'
import BlanketApprovalDetails from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/BlanketApprovalDetails.tsx'

export default function Projects() {
  usePageTitle('Blanket approval details')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle
            pageTitle="Generate DB"
            projectTitle="Blanket approval details"
          />
        </PageHeading>
      </HeaderTitle>
      <BlanketApprovalDetails />
    </PageWrapper>
  )
}
