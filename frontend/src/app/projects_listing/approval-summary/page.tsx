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
import ApprovalSummary from '@ors/components/manage/Blocks/ProjectsListing/ApprovalSummary/ApprovalSummary.tsx'

export default function Projects() {
  usePageTitle('Projects approval summary')

  const { canApproveProjects } = useContext(PermissionsContext)

  if (!canApproveProjects) {
    return <Redirect to="/projects/listing" />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle pageTitle="Generate DB" projectTitle="Approval summary" />
        </PageHeading>
      </HeaderTitle>
      <ApprovalSummary />
    </PageWrapper>
  )
}
