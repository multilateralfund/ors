import { useContext } from 'react'

import ProjectsPostExComUpdateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsPostExComUpdateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function PostExComUpdateProject() {
  usePageTitle('Post ExCom update')

  const { project_id } = useParams<Record<string, string>>()
  const { canEditApprovedProjects } = useContext(PermissionsContext)

  if (!canEditApprovedProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <ProjectsPostExComUpdateWrapper key={project_id} />
    </PageWrapper>
  )
}
