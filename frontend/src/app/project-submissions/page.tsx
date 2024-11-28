import PSListing from '@ors/components/manage/Blocks/ProjectSubmissions/PSListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

// export const metadata: Metadata = {
//   description: 'Listing of newly submitted projects',
//   title: 'Project submissions',
// }

export default function ProjectSubmissions() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>Project submissions</PageHeading>
      </HeaderTitle>
      <PSListing />
    </PageWrapper>
  )
}
