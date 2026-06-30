import PCRListingWrapper from '@ors/components/manage/Blocks/PCR/PCRListing/PCRListingWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PCRListing() {
  usePageTitle('PCR listing')

  return (
    <PageWrapper>
      <PCRListingWrapper />
    </PageWrapper>
  )
}
