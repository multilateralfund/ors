import PEnterpriseCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/create/PEnterpriseCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PEnterprisesCreate() {
  usePageTitle('Project enterprise create')

  return (
    <PageWrapper>
      <PEnterpriseCreateWrapper />
    </PageWrapper>
  )
}
