import ProjectsAssociateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsAssociate/ProjectsAssociateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import { useContext } from 'react'
import NotFoundPage from '@ors/app/not-found'

export default function ProjectsAssociationPage() {
  usePageTitle('Projects association')

  const { canAssociateProjects } = useContext(PermissionsContext)

  if (!canAssociateProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">IA/BA Portal</PageHeading>
      <ProjectsAssociateWrapper />
    </PageWrapper>
  )
}
