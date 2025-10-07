import PEnterpriseViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/view/PEnterpriseViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

import { useParams } from 'wouter'

export default function PEnterprise() {
  usePageTitle('Project enterprise')

  const { enterprise_id } = useParams<Record<string, string>>()

  return (
    <PageWrapper>
      <PEnterpriseViewWrapper key={enterprise_id} />
    </PageWrapper>
  )
}
