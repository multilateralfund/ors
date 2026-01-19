import { useContext } from 'react'

import ProjectsCompareVersions from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCompareVersions/ProjectsCompareVersions.tsx'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import usePageTitle from '@ors/hooks/usePageTitle.ts'

import { Redirect } from 'wouter'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import {
  PageTitle,
  RedirectBackButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'

export default function CompareVersions() {
  usePageTitle('Compare versions')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle pageTitle="Generate DB" projectTitle="Compare versions" />
        </PageHeading>
      </HeaderTitle>
      <ProjectsCompareVersions />
    </PageWrapper>
  )
}
