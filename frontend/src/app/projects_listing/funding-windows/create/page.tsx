import FundingWindowCreateWrapper from '@ors/components/manage/Blocks/ProjectsListing/FundingWindows/create/FundingWindowCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function FundingWindowsCreate() {
  usePageTitle('Funding windows create')

  return (
    <PageWrapper>
      <FundingWindowCreateWrapper />
    </PageWrapper>
  )
}
