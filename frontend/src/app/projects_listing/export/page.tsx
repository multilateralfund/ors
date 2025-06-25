import { useContext } from 'react'

import usePageTitle from '@ors/hooks/usePageTitle'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PExport from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PExport'
import NotFoundPage from '@ors/app/not-found'

export default function Projects() {
  usePageTitle('Projects')

  const { canViewProjects } = useContext(PermissionsContext)

  if (!canViewProjects) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          <div className="flex gap-2.5">
            <span className="font-medium text-[#4D4D4D]">Generate DB:</span>
            <div>Project warehouse</div>
          </div>
        </PageHeading>
      </HeaderTitle>
      <PExport />
    </PageWrapper>
  )
}
