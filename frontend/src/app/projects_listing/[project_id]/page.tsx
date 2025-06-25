import usePageTitle from '@ors/hooks/usePageTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ProjectViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectViewWrapper'
import { useContext } from 'react'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import NotFoundPage from '@ors/app/not-found'

export default function Project() {
  usePageTitle('Project')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <ProjectViewWrapper />
    </PageWrapper>
  )
}
