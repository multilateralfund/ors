import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import { useContext } from 'react'

import { useParams } from 'wouter'
import NotFoundPage from '@ors/app/not-found'

export default function EditProject({ mode }: { mode: string }) {
  const pageTitle = mode === 'edit' ? 'Project edit' : 'Project submission'
  usePageTitle(pageTitle)

  const { canUpdateProjects, canSubmitProjects, canRecommendProjects } =
    useContext(PermissionsContext)

  if (mode === 'edit') {
    if (!canUpdateProjects && !canSubmitProjects && !canRecommendProjects) {
      return <NotFoundPage />
    }
  } else if (!canUpdateProjects) {
    return <NotFoundPage />
  }

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <ProjectsEditWrapper key={project_id} mode={mode} />
    </PageWrapper>
  )
}
