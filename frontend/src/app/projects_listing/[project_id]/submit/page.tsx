import { useContext } from 'react'

import ProjectsSubmitWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsSubmit/ProjectsSubmitWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function SubmitProject() {
  usePageTitle('Project submission')

  const { project_id } = useParams<Record<string, string>>()
  const { canViewProjects, canSubmitProjects } = useContext(PermissionsContext)

  if (!canViewProjects || !canSubmitProjects) {
    return <Redirect to="/projects-listing" />
  }

  return (
    <PageWrapper>
      <ProjectsSubmitWrapper key={project_id} />
    </PageWrapper>
  )
}
