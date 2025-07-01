import { useContext } from 'react'

import ProjectsCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import { Redirect } from 'wouter'

export default function CreateProject() {
  usePageTitle('Project creation')

  const { canUpdateProjects } = useContext(PermissionsContext)

  if (!canUpdateProjects) {
    return <Redirect to="/projects-listing" />
  }

  return (
    <PageWrapper>
      <ProjectsCreateWrapper />
    </PageWrapper>
  )
}
