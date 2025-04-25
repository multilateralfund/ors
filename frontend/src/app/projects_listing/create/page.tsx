import ProjectsCreate from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreate'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default function CreateProject() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>New submission</PageHeading>
      </HeaderTitle>
      <ProjectsCreate />
    </PageWrapper>
  )
}
