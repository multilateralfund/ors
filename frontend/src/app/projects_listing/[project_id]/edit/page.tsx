import { useContext } from 'react'

import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

const getPageTitle = (mode: string) => {
  switch (mode) {
    case 'edit':
      return 'Project edit'
    default:
      return 'Project creation'
  }
}

export default function EditProject({ mode }: { mode: string }) {
  usePageTitle(getPageTitle(mode))

  const { project_id } = useParams<Record<string, string>>()
  const { canUpdateProjects, canEditProjects } = useContext(PermissionsContext)

  if (
    (mode === 'edit' && !canEditProjects) ||
    (mode !== 'edit' && !canUpdateProjects)
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ProjectsEditWrapper key={project_id} mode={mode} />
    </PageWrapper>
  )
}
