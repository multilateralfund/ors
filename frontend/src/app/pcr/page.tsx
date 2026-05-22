import PCRWrapper from '@ors/components/manage/Blocks/PCR/listing/PCRWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PCRListing() {
  usePageTitle('PCRs')

  return (
    <PageWrapper>
      <PCRWrapper />
    </PageWrapper>
  )
}
