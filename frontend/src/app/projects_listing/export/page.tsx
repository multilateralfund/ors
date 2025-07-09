import { useContext } from 'react'

import PExport from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PExport'
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

export default function Projects() {
  usePageTitle('Projects export')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing" />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <PageTitle pageTitle="Generate DB" projectTitle="Project warehouse" />
        </PageHeading>
      </HeaderTitle>
      <PExport />
    </PageWrapper>
  )
}
