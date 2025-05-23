import ProjectsCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsCreate/ProjectsCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function CreateProject() {
  usePageTitle('Project submission')

  return (
    <PageWrapper>
      <ProjectsCreateWrapper />
    </PageWrapper>
  )
}
