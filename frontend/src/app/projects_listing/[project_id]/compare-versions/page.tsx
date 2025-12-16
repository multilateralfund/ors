import { useContext } from 'react'

import ProjectCompareVersions from '@ors/components/manage/Blocks/ProjectsListing/ProjectCompareVersions/ProjectCompareVersions.tsx'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import usePageTitle from '@ors/hooks/usePageTitle.ts'

import { Redirect, useParams } from 'wouter'

export default function SubmitProject() {
  usePageTitle('Compare versions')

  const { project_id } = useParams<Record<string, string>>()
  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ProjectCompareVersions project_id={project_id} />
    </PageWrapper>
  )
}
