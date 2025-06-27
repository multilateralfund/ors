import { useContext } from 'react'

import ProjectsAssociateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsAssociate/ProjectsAssociateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect } from 'wouter'

export default function ProjectsAssociationPage() {
  usePageTitle('Projects association')

  const { canViewProjects, canAssociateProjects } =
    useContext(PermissionsContext)

  if (!canViewProjects || !canAssociateProjects) {
    return <Redirect to="/projects-listing" />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">IA/BA Portal</PageHeading>
      <ProjectsAssociateWrapper />
    </PageWrapper>
  )
}
