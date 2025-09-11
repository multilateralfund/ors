import PEnterprisesEditWrapper from '@ors/components/manage/Blocks/ProjectsListing/ProjectsEnterprises/edit/PEnterprisesEditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PEnterprisesEdit() {
  usePageTitle('Project enterprise edit')

  return (
    <PageWrapper>
      <PEnterprisesEditWrapper />
    </PageWrapper>
  )
}
