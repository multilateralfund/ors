import usePageTitle from '@ors/hooks/usePageTitle'

import PListing from '@ors/components/manage/Blocks/Projects/PListing'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function Projects() {
  usePageTitle('Projects')
  return (
    <PageWrapper>
      <PListing />
    </PageWrapper>
  )
}
