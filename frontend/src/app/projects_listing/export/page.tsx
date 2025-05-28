import usePageTitle from '@ors/hooks/usePageTitle'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PExport from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PExport'

export default function Projects() {
  usePageTitle('Projects')

  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading className="min-w-fit">Generate DB</PageHeading>
      </HeaderTitle>
      <PExport />
    </PageWrapper>
  )
}
