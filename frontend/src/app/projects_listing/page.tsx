import usePageTitle from '@ors/hooks/usePageTitle'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PListing from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListing'

export default function Projects() {
  usePageTitle('Projects')

  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading className="min-w-fit">Projects</PageHeading>
      </HeaderTitle>
      <PListing />
    </PageWrapper>
  )
}
