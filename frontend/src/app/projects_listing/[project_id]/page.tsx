import { useContext } from 'react'

import ProjectViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function Project() {
  usePageTitle('Project')

  const { project_id } = useParams<Record<string, string>>()

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ProjectViewWrapper key={project_id} />
    </PageWrapper>
  )
}
