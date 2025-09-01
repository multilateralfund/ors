import PEnterprisesWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/PEnterprisesWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function Enterprises() {
  usePageTitle('Enterprises')

  return (
    <PageWrapper>
      <PEnterprisesWrapper />
    </PageWrapper>
  )
}
