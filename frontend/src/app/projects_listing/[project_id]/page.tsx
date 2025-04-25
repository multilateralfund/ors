import usePageTitle from '@ors/hooks/usePageTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ProjectViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectViewWrapper'

export default function Project() {
  usePageTitle('Project')

  return (
    <PageWrapper>
      <ProjectViewWrapper />
    </PageWrapper>
  )
}
