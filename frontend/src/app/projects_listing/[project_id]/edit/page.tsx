import usePageTitle from '@ors/hooks/usePageTitle'

import ProjectsEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEdit/ProjectsEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function Project() {
  usePageTitle('Project edit')

  return (
    <PageWrapper>
      <ProjectsEditWrapper />
    </PageWrapper>
  )
}
