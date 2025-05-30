import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function EditProject({ mode }: { mode: string }) {
  const pageTitle = mode === 'edit' ? 'Project edit' : 'Project submission'
  usePageTitle(pageTitle)

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <ProjectsEditWrapper key={project_id} mode={mode} />
    </PageWrapper>
  )
}
