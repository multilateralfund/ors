import EnterpriseWrapper from '@ors/components/manage/Blocks/ProjectsListing/Enterprises/view/EnterpriseWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function Enterprise() {
  usePageTitle('Enterprise')

  return (
    <PageWrapper>
      <EnterpriseWrapper />
    </PageWrapper>
  )
}
