import ProjectsAssociateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsAssociate/ProjectsAssociateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function ProjectsAssociationPage() {
  usePageTitle('Projects association')

  return (
    <PageWrapper>
      <PageHeading className="min-w-fit">IA/BA Portal</PageHeading>
      <ProjectsAssociateWrapper />
    </PageWrapper>
  )
}
