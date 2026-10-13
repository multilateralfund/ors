import ManagePCRsWrapper from '@ors/components/manage/Blocks/PCR/ManagePCRs/ManagePCRsWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function ManagePCRs() {
  usePageTitle('Manage PCRs')

  return (
    <PageWrapper>
      <ManagePCRsWrapper />
    </PageWrapper>
  )
}
