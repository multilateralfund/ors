import EnterprisesWrapper from '@ors/components/manage/Blocks/ProjectsListing/Enterprises/listing/EnterprisesWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function Enterprises() {
  usePageTitle('Enterprises')

  return (
    <PageWrapper>
      <EnterprisesWrapper />
    </PageWrapper>
  )
}
