import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ProjectViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectViewWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'
import { useContext } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import NotFoundPage from '@ors/app/not-found'

export default function Project() {
  usePageTitle('Project')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <ProjectViewWrapper key={project_id} />
    </PageWrapper>
  )
}
