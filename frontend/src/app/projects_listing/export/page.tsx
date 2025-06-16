import usePageTitle from '@ors/hooks/usePageTitle'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PExport from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PExport'

export default function Projects() {
  usePageTitle('Projects')

  return (
    <PageWrapper>
      <HeaderTitle>
        <RedirectBackButton />
        <PageHeading className="min-w-fit">
          Generate DB: Project warehouse
        </PageHeading>
      </HeaderTitle>
      <PExport />
    </PageWrapper>
  )
}
