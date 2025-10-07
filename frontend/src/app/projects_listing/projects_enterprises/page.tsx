import PEnterprisesWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/listing/PEnterprisesWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function PEnterprises() {
  usePageTitle('Projects enterprises')

  const { project_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <PEnterprisesWrapper key={project_id} />
    </PageWrapper>
  )
}
