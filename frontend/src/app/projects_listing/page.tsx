import { useContext } from 'react'

import PListing from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListing'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

export default function Projects() {
  usePageTitle('Projects')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">IA/BA Portal</PageHeading>
      <PListing />
    </PageWrapper>
  )
}
