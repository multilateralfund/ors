import { useContext } from 'react'

import ProjectsCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

export default function CreateProject() {
  usePageTitle('Project creation')

  const { canUpdateProjects } = useContext(PermissionsContext)

  if (!canUpdateProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <ProjectsCreateWrapper />
    </PageWrapper>
  )
}
