import { useContext } from 'react'

import ProjectsApprovalWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsApprovalWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function ProjectsApprovalUpdatePage() {
  usePageTitle('Approval project')

  const { project_id } = useParams<Record<string, string>>()
  const { canApproveProjects } = useContext(PermissionsContext)

  if (!canApproveProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ProjectsApprovalWrapper key={project_id} />
    </PageWrapper>
  )
}
