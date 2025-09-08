import PEnterprisesViewWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/view/PEnterprisesViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function Enterprise() {
  usePageTitle('Project enterprise')

  return (
    <PageWrapper>
      <PEnterprisesViewWrapper />
    </PageWrapper>
  )
}
