import usePageTitle from '@ors/hooks/usePageTitle'

import PSListing from '@ors/components/manage/Blocks/ProjectSubmissions/PSListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default function ProjectSubmissions() {
  usePageTitle('Project submissions')
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>Project submissions</PageHeading>
      </HeaderTitle>
      <PSListing />
    </PageWrapper>
  )
}
