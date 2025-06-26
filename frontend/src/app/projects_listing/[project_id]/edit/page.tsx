import { useContext } from 'react'

import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

import { useParams } from 'wouter'

export default function EditProject({ mode }: { mode: string }) {
  const pageTitle = mode === 'edit' ? 'Project edit' : 'Project creation'
  usePageTitle(pageTitle)

  const { project_id } = useParams<Record<string, string>>()
  const { canUpdateProjects, canEditProjects } = useContext(PermissionsContext)

  if (
    (mode === 'edit' && !canEditProjects) ||
    (mode !== 'edit' && !canUpdateProjects)
  ) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <ProjectsEditWrapper key={project_id} mode={mode} />
    </PageWrapper>
  )
}
