import PEnterprisesViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/view/PEnterprisesViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function Enterprise() {
  usePageTitle('Project enterprise')

  const { enterprise_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <PEnterprisesViewWrapper key={enterprise_id} />
    </PageWrapper>
  )
}
