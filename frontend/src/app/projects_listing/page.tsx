import usePageTitle from '@ors/hooks/usePageTitle'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PListing from '@ors/components/manage/Blocks/ProjectsListing/ProjectsListing/PListing'

export default function Projects() {
  usePageTitle('Projects')

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">IA/BA Portal</PageHeading>
      <PListing />
    </PageWrapper>
  )
}
