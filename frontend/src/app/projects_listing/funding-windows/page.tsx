import FundingWindowsWrapper from '@ors/components/manage/Blocks/ProjectsListing/FundingWindows/listing/FundingWindowsWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function FundingWindows() {
  usePageTitle('Funding windows')

  return (
    <PageWrapper>
      <FundingWindowsWrapper />
    </PageWrapper>
  )
}
