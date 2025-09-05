import PEnterprisesCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/create/PEnterprisesCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function EnterprisesCreate() {
  usePageTitle('Enterprise create')

  return (
    <PageWrapper>
      <PEnterprisesCreateWrapper />
    </PageWrapper>
  )
}
