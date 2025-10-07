import EnterpriseEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/Enterprises/edit/EnterpriseEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function EnterpriseEdit() {
  usePageTitle('Enterprise edit')

  return (
    <PageWrapper>
      <EnterpriseEditWrapper />
    </PageWrapper>
  )
}
