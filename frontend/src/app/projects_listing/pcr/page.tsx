import { useContext } from 'react'

import PCRListingWrapper from '@ors/components/manage/Blocks/ProjectsListing/PCR/PCRListingWrapper'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

export default function ProjectCompletionReports() {
  usePageTitle('Project Completion Reports')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
            <PageHeading className="min-w-fit">
              IA/BA Portal - Project Completion Reports
            </PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <PCRListingWrapper />
    </PageWrapper>
  )
}
