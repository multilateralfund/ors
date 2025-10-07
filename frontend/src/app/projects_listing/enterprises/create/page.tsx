import EnterpriseCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/Enterprises/create/EnterpriseCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function EnterpriseCreate() {
  usePageTitle('Enterprise create')

  return (
    <PageWrapper>
      <EnterpriseCreateWrapper />
    </PageWrapper>
  )
}
