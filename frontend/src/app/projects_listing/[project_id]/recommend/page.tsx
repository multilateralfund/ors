import { useContext } from 'react'

import ProjectsVersionChangeWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsVersionChange/ProjectsVersionChangeWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function RecommendProject() {
  usePageTitle('Project recommendation')

  const { project_id } = useParams<Record<string, string>>()
  const { canViewProjects, canRecommendProjects } =
    useContext(PermissionsContext)

  if (!canViewProjects || !canRecommendProjects) {
    return <Redirect to="/projects/listing" />
  }

  return (
    <PageWrapper>
      <ProjectsVersionChangeWrapper key={project_id} mode="recommend" />
    </PageWrapper>
  )
}
