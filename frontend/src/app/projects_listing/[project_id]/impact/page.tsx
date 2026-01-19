import ProjectsImpactWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsImpactWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function ProjectsImpactUpdatePage() {
  usePageTitle('Project impact update')

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <ProjectsImpactWrapper key={project_id} />
    </PageWrapper>
  )
}
