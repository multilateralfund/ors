import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ProjectViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectViewWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function Project() {
  usePageTitle('Project')

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <ProjectViewWrapper key={project_id} />
    </PageWrapper>
  )
}
