import PEnterpriseEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/edit/PEnterpriseEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PEnterprisesEdit() {
  usePageTitle('Project enterprise edit')

  return (
    <PageWrapper>
      <PEnterpriseEditWrapper />
    </PageWrapper>
  )
}
