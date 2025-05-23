import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function CopyProject() {
  usePageTitle('Project submission')

  return (
    <PageWrapper>
      <ProjectsEditWrapper mode="copy" />
    </PageWrapper>
  )
}
